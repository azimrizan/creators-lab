'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Languages, X } from 'lucide-react';
import { DubbingInfo, DubTrack, findDubLanguage } from '@/lib/dubbing/languages';

const AUDIO_PREF_KEY = 'cl-audio-language';
const SUBS_PREF_KEY = 'cl-subtitle-language';
const ORIGINAL = 'original';
const OFF = 'off';
// Re-sync the dub to the video when they drift further apart than this (seconds).
const MAX_DRIFT = 0.3;

interface Cue { start: number; end: number; text: string }

const LANGUAGE_NAMES: Record<string, string> = { en: 'English' };
// Whisper reports the source language as a name ("english"); dub tracks use two-letter codes.
const languageName = (code: string) =>
  findDubLanguage(code)?.label || LANGUAGE_NAMES[code] || (code.length > 2 ? code[0].toUpperCase() + code.slice(1).toLowerCase() : code.toUpperCase());

function readPref(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preference just won't be remembered.
  }
}

function parseVtt(text: string): Cue[] {
  const toSec = (t: string) => {
    const parts = t.trim().split(':').map(Number);
    return parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
  };
  return text
    .replace(/\r/g, '')
    .split('\n\n')
    .map(block => {
      const lines = block.split('\n');
      const timing = lines.findIndex(l => l.includes('-->'));
      if (timing < 0) return null;
      const [start, end] = lines[timing].split('-->');
      return { start: toSec(start), end: toSec(end.split(' ').filter(Boolean)[0]), text: lines.slice(timing + 1).join('\n') };
    })
    .filter((c): c is Cue => Boolean(c && c.text));
}

/**
 * Netflix-style "Audio & Subtitles" menu for a lesson video. A dubbed track plays in a hidden
 * <audio> element kept in sync with the video, while the video's own sound is silenced through
 * a Web Audio gain node so the native volume and mute controls keep working for the dub.
 */
export default function DubbedAudio({ videoRef, videoUrl, hidden }: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoUrl: string;
  hidden?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const gainRef = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  // Fetched state is stored with the URL it belongs to, so a lesson change never shows stale data.
  const [loaded, setLoaded] = useState<{ videoUrl: string; info: DubbingInfo } | null>(null);
  const [audioLang, setAudioLang] = useState(ORIGINAL);
  const [subsLang, setSubsLang] = useState(OFF);
  const [isOpen, setIsOpen] = useState(false);
  const [subs, setSubs] = useState<{ url: string; cues: Cue[] } | null>(null);
  const [caption, setCaption] = useState<{ url: string; text: string } | null>(null);

  const info = loaded?.videoUrl === videoUrl ? loaded.info : null;
  const readyTracks = (info?.tracks || []).filter(t => t.status === 'ready' && t.audioUrl);
  const activeTrack: DubTrack | undefined = readyTracks.find(t => t.language === audioLang);
  const sourceLabel = `${languageName(info?.sourceLanguage || 'en')} (Original)`;
  const subsUrl = subsLang === OFF
    ? null
    : subsLang === ORIGINAL
      ? info?.sourceSubtitlesUrl || null
      : readyTracks.find(t => t.language === subsLang)?.subtitlesUrl || null;
  const cues = subs && subs.url === subsUrl ? subs.cues : null;
  const captionText = caption && caption.url === subsUrl ? caption.text : '';

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dubbing?video=${encodeURIComponent(videoUrl)}`)
      .then(res => res.json())
      .then((data: DubbingInfo & { success: boolean }) => {
        if (cancelled || !data.success) return;
        setLoaded({ videoUrl, info: data });
        const ready = data.tracks.filter(t => t.status === 'ready').map(t => t.language);
        const audioPref = readPref(AUDIO_PREF_KEY);
        setAudioLang(audioPref && ready.includes(audioPref) ? audioPref : ORIGINAL);
        const subsPref = readPref(SUBS_PREF_KEY);
        const subsAvailable = [...ready, ...(data.sourceSubtitlesUrl ? [ORIGINAL] : [])];
        setSubsLang(subsPref && subsAvailable.includes(subsPref) ? subsPref : OFF);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [videoUrl]);

  // Silence the video's own soundtrack while a dub plays. Same-origin videos are routed through a
  // gain node; for cross-origin videos (which Web Audio can't read) fall back to muting the element.
  const setOriginalSilenced = useCallback((silenced: boolean) => {
    const video = videoRef.current;
    if (!video) return;
    const sameOrigin = !video.currentSrc || new URL(video.currentSrc, location.href).origin === location.origin;
    if (!sameOrigin) {
      video.muted = silenced;
      return;
    }
    if (!gainRef.current) {
      if (!silenced) return;
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      ctx.createMediaElementSource(video).connect(gain).connect(ctx.destination);
      gainRef.current = { ctx, gain };
    }
    gainRef.current.gain.gain.value = silenced ? 0 : 1;
    if (gainRef.current.ctx.state === 'suspended') gainRef.current.ctx.resume().catch(() => {});
  }, [videoRef]);

  // Load the chosen track and keep it locked to the video.
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    if (!activeTrack?.audioUrl) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setOriginalSilenced(false);
      return;
    }

    setOriginalSilenced(true);
    audio.src = activeTrack.audioUrl;

    const mirror = () => {
      audio.volume = video.volume;
      audio.muted = video.muted && Boolean(gainRef.current);
      audio.playbackRate = video.playbackRate;
    };
    const seek = () => { audio.currentTime = video.currentTime; };
    const play = () => {
      seek();
      if (!video.paused) audio.play().catch(() => {});
    };
    const pause = () => audio.pause();
    const correctDrift = () => {
      if (!video.paused && Math.abs(audio.currentTime - video.currentTime) > MAX_DRIFT && video.currentTime < audio.duration) seek();
    };

    mirror();
    audio.addEventListener('loadedmetadata', play, { once: true });
    video.addEventListener('play', play);
    video.addEventListener('playing', play);
    video.addEventListener('pause', pause);
    video.addEventListener('waiting', pause);
    video.addEventListener('seeked', play);
    video.addEventListener('ratechange', mirror);
    video.addEventListener('volumechange', mirror);
    video.addEventListener('timeupdate', correctDrift);
    return () => {
      audio.removeEventListener('loadedmetadata', play);
      video.removeEventListener('play', play);
      video.removeEventListener('playing', play);
      video.removeEventListener('pause', pause);
      video.removeEventListener('waiting', pause);
      video.removeEventListener('seeked', play);
      video.removeEventListener('ratechange', mirror);
      video.removeEventListener('volumechange', mirror);
      video.removeEventListener('timeupdate', correctDrift);
    };
  }, [activeTrack?.audioUrl, videoRef, setOriginalSilenced]);

  // Subtitles: fetch the chosen VTT and show the cue under the playhead.
  useEffect(() => {
    if (!subsUrl) return;
    let cancelled = false;
    fetch(subsUrl)
      .then(res => res.text())
      .then(text => { if (!cancelled) setSubs({ url: subsUrl, cues: parseVtt(text) }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [subsUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !subsUrl || !cues?.length) return;
    const update = () => {
      const t = video.currentTime;
      setCaption({ url: subsUrl, text: cues.find(c => t >= c.start && t <= c.end)?.text || '' });
    };
    // Show the right cue straight away, even while paused.
    const frame = requestAnimationFrame(update);
    video.addEventListener('timeupdate', update);
    video.addEventListener('seeked', update);
    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener('timeupdate', update);
      video.removeEventListener('seeked', update);
    };
  }, [cues, subsUrl, videoRef]);

  useEffect(() => () => { gainRef.current?.ctx.close().catch(() => {}); }, []);

  const chooseAudio = (lang: string) => {
    setAudioLang(lang);
    writePref(AUDIO_PREF_KEY, lang);
    // Selecting is a user gesture, so the audio context may start here.
    if (lang !== ORIGINAL) setOriginalSilenced(true);
  };

  const chooseSubs = (lang: string) => {
    setSubsLang(lang);
    writePref(SUBS_PREF_KEY, lang);
  };

  const hasOptions = readyTracks.length > 0 || Boolean(info?.sourceSubtitlesUrl);

  return (
    <>
      <audio ref={audioRef} preload="auto" className="hidden" />

      {captionText && (
        <div className="absolute inset-x-0 bottom-14 sm:bottom-16 z-10 flex justify-center px-6 pointer-events-none">
          <span className="max-w-[90%] text-center whitespace-pre-line text-white text-sm sm:text-lg font-medium leading-snug bg-black/70 rounded-lg px-3 py-1.5">
            {captionText}
          </span>
        </div>
      )}

      {hasOptions && !hidden && (
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={() => setIsOpen(o => !o)}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white bg-black/55 hover:bg-black/75 backdrop-blur-sm rounded-full px-3 py-1.5 transition"
            aria-expanded={isOpen}
            aria-label="Audio and subtitles"
          >
            <Languages className="w-3.5 h-3.5" />
            {activeTrack ? languageName(activeTrack.language) : 'Audio & Subtitles'}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-[min(420px,calc(100vw-32px))] bg-zinc-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold">Audio &amp; Subtitles</span>
                <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 max-h-[40vh] overflow-y-auto no-scrollbar">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.12em] text-white/50 mb-1.5">AUDIO</div>
                  <MenuItem selected={audioLang === ORIGINAL} onClick={() => chooseAudio(ORIGINAL)}>{sourceLabel}</MenuItem>
                  {readyTracks.map(t => (
                    <MenuItem key={t.language} selected={audioLang === t.language} onClick={() => chooseAudio(t.language)} note="AI dubbed">
                      {languageName(t.language)}
                    </MenuItem>
                  ))}
                </div>
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.12em] text-white/50 mb-1.5">SUBTITLES</div>
                  <MenuItem selected={subsLang === OFF} onClick={() => chooseSubs(OFF)}>Off</MenuItem>
                  {info?.sourceSubtitlesUrl && (
                    <MenuItem selected={subsLang === ORIGINAL} onClick={() => chooseSubs(ORIGINAL)}>{sourceLabel}</MenuItem>
                  )}
                  {readyTracks.map(t => (
                    <MenuItem key={t.language} selected={subsLang === t.language} onClick={() => chooseSubs(t.language)}>
                      {languageName(t.language)}
                    </MenuItem>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function MenuItem({ selected, onClick, children, note }: { selected: boolean; onClick: () => void; children: React.ReactNode; note?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 text-left text-[13px] px-2 py-2 rounded-lg transition ${selected ? 'text-white font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
    >
      <Check className={`w-3.5 h-3.5 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} />
      <span className="flex-1 truncate">{children}</span>
      {note && <span className="text-[10px] text-white/40 shrink-0">{note}</span>}
    </button>
  );
}
