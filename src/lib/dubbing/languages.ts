/** Indian languages a lesson can be dubbed into, with a free male and female Edge neural voice for each. Safe to import on the client. */
export interface DubLanguage {
  code: string;
  label: string;
  nativeLabel: string;
  voices: { male: string; female: string };
}

export type DubVoice = 'male' | 'female';

export const DUB_LANGUAGES: DubLanguage[] = [
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', voices: { male: 'hi-IN-MadhurNeural', female: 'hi-IN-SwaraNeural' } },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ', voices: { male: 'kn-IN-GaganNeural', female: 'kn-IN-SapnaNeural' } },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', voices: { male: 'ta-IN-ValluvarNeural', female: 'ta-IN-PallaviNeural' } },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు', voices: { male: 'te-IN-MohanNeural', female: 'te-IN-ShrutiNeural' } },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', voices: { male: 'ml-IN-MidhunNeural', female: 'ml-IN-SobhanaNeural' } },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', voices: { male: 'mr-IN-ManoharNeural', female: 'mr-IN-AarohiNeural' } },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা', voices: { male: 'bn-IN-BashkarNeural', female: 'bn-IN-TanishaaNeural' } },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી', voices: { male: 'gu-IN-NiranjanNeural', female: 'gu-IN-DhwaniNeural' } },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو', voices: { male: 'ur-IN-SalmanNeural', female: 'ur-IN-GulNeural' } }
];

export const findDubLanguage = (code: string) => DUB_LANGUAGES.find(l => l.code === code);

export type DubStatus = 'queued' | 'transcribing' | 'translating' | 'voicing' | 'mixing' | 'ready' | 'failed';

/** One generated audio track, as returned by GET /api/dubbing. */
export interface DubTrack {
  language: string;
  voice: DubVoice;
  status: DubStatus;
  /** 0–100 while the job runs. */
  progress: number;
  error?: string;
  audioUrl?: string;
  subtitlesUrl?: string;
  updatedAt: string;
}

export interface DubbingInfo {
  sourceLanguage: string;
  /** Subtitles in the lesson's original language, available once any track has been generated. */
  sourceSubtitlesUrl?: string;
  tracks: DubTrack[];
}
