'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Send, Compass, LifeBuoy, ArrowRight, ShoppingBag, Check, Star, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import FormattedMarkdown from '@/components/FormattedMarkdown';
import { agentGet, agentSend } from './agentClient';

type CourseCardAction = { id: string; slug: string; title: string; thumbnail: string; price: number; discountPrice?: number; rating: number; level: string; reason: string };
type DockAction =
  | { type: 'courses'; items: CourseCardAction[] }
  | { type: 'link'; href: string; label: string }
  | { type: 'cart'; courseId: string; slug: string; title: string }
  | { type: 'profile_saved' };

interface DockMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: DockAction[];
  ticket?: string | null;
  isError?: boolean;
}

interface ConciergeState {
  needsOnboarding: boolean;
  welcome: { message: string; action: { label: string; href: string } } | null;
  history: Array<{ role: 'user' | 'assistant'; content: string; actions?: DockAction[] }>;
}

const ONBOARDING_CHIPS = ['Films & cinematography', 'Photography', 'Editing & color grading', '3D & motion design', 'Music & sound', 'Design & branding'];
const GUIDE_CHIPS = ['What should I learn first?', 'Show me beginner courses', 'Plan my week'];
const HELP_CHIPS = ['I paid but can\'t see my course', 'How do certificates work?', 'Show my orders'];

const HIDDEN_PREFIXES = ['/watch', '/exam', '/admin', '/instructor'];
const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Site-wide AI dock: the Concierge (onboarding, recommendations, navigation) and the Support agent.
 * The lesson player has its own tutor panel, so the dock is hidden there.
 */
export default function AgentDock() {
  const pathname = usePathname();
  const { currentUser, addToCart, cartCourseIds } = useAppStore();
  const isGuest = currentUser.id === 'guest';

  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<'guide' | 'help'>('guide');
  const [guideMessages, setGuideMessages] = useState<DockMessage[]>([]);
  const [helpMessages, setHelpMessages] = useState<DockMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [welcome, setWelcome] = useState<ConciergeState['welcome']>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const loadedFor = useRef<string | null>(null);

  const firstName = currentUser.name?.split(' ')[0] || 'there';

  // Load onboarding state, welcome-back message and saved conversation for this user.
  useEffect(() => {
    if (loadedFor.current === currentUser.id) return;
    loadedFor.current = currentUser.id;
    setGuideMessages([]);
    setHelpMessages([]);
    setWelcome(null);
    setOnboarding(false);
    if (isGuest) return;

    agentGet<ConciergeState>('/api/ai/concierge')
      .then(state => {
        const history = state.history.map(h => ({ id: newId(), role: h.role, content: h.content, actions: h.actions }));
        if (state.needsOnboarding) {
          setOnboarding(true);
          setTab('guide');
          setGuideMessages(history.length ? history : [{
            id: newId(),
            role: 'assistant',
            content: `Hi ${currentUser.name?.split(' ')[0] || 'there'}! I'm your Creators Lab guide. I'll ask a few quick questions so I can point you to the right courses.\n\nFirst: what would you love to create?`
          }]);
          setIsOpen(true);
          return;
        }
        setGuideMessages(history);
        if (state.welcome) {
          let shown = false;
          try {
            shown = sessionStorage.getItem(`cl-welcome-${currentUser.id}`) === '1';
            sessionStorage.setItem(`cl-welcome-${currentUser.id}`, '1');
          } catch {}
          if (!shown) setWelcome(state.welcome);
        }
      })
      .catch(() => {});

    agentGet<{ history: Array<{ role: 'user' | 'assistant'; content: string; ticket?: string }> }>('/api/ai/support')
      .then(data => setHelpMessages(data.history.map(h => ({ id: newId(), role: h.role, content: h.content, ticket: h.ticket }))))
      .catch(() => {});
  }, [currentUser.id, currentUser.name, isGuest]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [guideMessages, helpMessages, isLoading, tab, isOpen]);

  const messages = tab === 'guide' ? guideMessages : helpMessages;

  const send = useCallback(async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isLoading) return;
    const activeTab = tab;
    const update = activeTab === 'guide' ? setGuideMessages : setHelpMessages;
    const previous = activeTab === 'guide' ? guideMessages : helpMessages;

    update(prev => [...prev, { id: newId(), role: 'user', content: message }]);
    setInput('');
    setIsLoading(true);

    try {
      const history = isGuest ? previous.filter(m => !m.isError).map(m => ({ role: m.role, content: m.content })) : undefined;
      if (activeTab === 'guide') {
        const data = await agentSend<{ reply: string; actions: DockAction[] }>('/api/ai/concierge', {
          message,
          history,
          mode: onboarding ? 'onboarding' : 'chat'
        });
        if (data.actions.some(a => a.type === 'profile_saved')) setOnboarding(false);
        data.actions.forEach(a => {
          if (a.type === 'cart' && !isGuest) addToCart(a.courseId);
        });
        update(prev => [...prev, { id: newId(), role: 'assistant', content: data.reply, actions: data.actions }]);
      } else {
        const data = await agentSend<{ reply: string; ticketNumber: string | null }>('/api/ai/support', { message, history });
        update(prev => [...prev, { id: newId(), role: 'assistant', content: data.reply, ticket: data.ticketNumber }]);
      }
    } catch (err) {
      update(prev => [...prev, { id: newId(), role: 'assistant', content: err instanceof Error ? err.message : 'Something went wrong.', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, tab, guideMessages, helpMessages, isGuest, onboarding, addToCart]);

  const skipOnboarding = async () => {
    setOnboarding(false);
    setIsOpen(false);
    try {
      await agentSend('/api/ai/concierge', {}, 'PATCH');
    } catch {}
  };

  if (HIDDEN_PREFIXES.some(p => pathname?.startsWith(p))) return null;

  const chips = tab === 'help' ? HELP_CHIPS : onboarding && guideMessages.filter(m => m.role === 'user').length === 0 ? ONBOARDING_CHIPS : GUIDE_CHIPS;
  const showChips = !isLoading && (messages.length === 0 || (onboarding && guideMessages.filter(m => m.role === 'user').length === 0));

  return (
    <>
      {/* Welcome-back bubble */}
      {welcome && !isOpen && (
        <div className="fixed z-40 right-4 sm:right-6 bottom-24 w-[calc(100vw-32px)] max-w-[340px] bg-white border border-lavender-line rounded-2xl p-4 shadow-[0_20px_40px_-16px_rgba(23,20,43,0.35)]">
          <button onClick={() => setWelcome(null)} aria-label="Dismiss" className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-ink-muted hover:bg-lavender">
            <X className="w-4 h-4" />
          </button>
          <div className="flex gap-3 pr-6">
            <img src="/agent-icon.png" alt="" className="w-9 h-9 object-contain shrink-0" />
            <p className="text-[13px] leading-relaxed text-ink-body">{welcome.message}</p>
          </div>
          <Link
            href={welcome.action.href}
            onClick={() => setWelcome(null)}
            className="mt-3 w-full h-10 rounded-full btn-soft text-sm font-semibold flex items-center justify-center gap-2 transition"
          >
            {welcome.action.label}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Launcher */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setWelcome(null); }}
          aria-label="Open Creators Lab AI guide"
          className="fixed z-40 right-4 sm:right-6 bottom-4 sm:bottom-6 h-14 pl-2 pr-5 rounded-full btn-soft shadow-[0_16px_32px_-12px_rgba(23,20,43,0.6)] flex items-center gap-2 transition"
        >
          <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <img src="/agent-icon.png" alt="" className="w-8 h-8 object-contain" />
          </span>
          <span className="text-sm font-semibold">Ask AI</span>
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Creators Lab AI"
          className="fixed z-50 inset-0 sm:inset-auto sm:right-6 sm:bottom-6 sm:w-[400px] sm:h-[min(640px,calc(100vh-120px))] bg-white sm:rounded-3xl border border-lavender-line shadow-[0_30px_60px_-20px_rgba(23,20,43,0.45)] flex flex-col overflow-hidden"
        >
          <div className="px-4 pt-4 pb-3 border-b border-[#F0EEF6] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img src="/agent-icon.png" alt="" className="w-9 h-9 object-contain shrink-0" />
              <div className="min-w-0">
                <p className="font-display font-semibold text-ink text-[15px] leading-tight">{onboarding ? `Welcome, ${firstName}` : 'Creators Lab AI'}</p>
                <p className="text-xs text-ink-muted truncate">{onboarding ? 'Let\'s find your path' : tab === 'guide' ? 'Courses, planning and navigation' : 'Payments, access and certificates'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onboarding && (
                <button onClick={skipOnboarding} className="text-xs font-semibold text-ink-muted hover:text-ink px-3 h-9 rounded-full hover:bg-lavender transition">
                  Not now
                </button>
              )}
              <button onClick={() => setIsOpen(false)} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center text-ink-muted hover:bg-lavender hover:text-ink transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {!onboarding && (
            <div role="tablist" className="px-4 pt-3 flex gap-2">
              {([['guide', 'Guide', Compass], ['help', 'Help', LifeBuoy]] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`h-9 px-4 rounded-full text-[13px] font-semibold flex items-center gap-1.5 border transition ${
                    tab === id ? 'btn-soft' : 'bg-white text-ink-body border-[#E2DEEF] hover:bg-[#FBFAFF]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          )}

          <div ref={feedRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 bg-[#FBFAFF]">
            {messages.length === 0 && (
              <div className="text-center py-6 px-2">
                <img src="/agent-icon.png" alt="" className="w-16 h-16 object-contain mx-auto" />
                <p className="font-display font-semibold text-ink mt-3">
                  {tab === 'guide' ? 'Where do you want to go?' : 'How can we help?'}
                </p>
                <p className="text-[13px] text-ink-muted mt-1">
                  {tab === 'guide'
                    ? 'Ask for course suggestions, a study plan, or help finding anything on the site.'
                    : isGuest ? 'Sign in so I can look up your orders and courses.' : 'I can check your orders, course access and certificates.'}
                </p>
              </div>
            )}

            {messages.map(msg => (
              <div key={msg.id} className={msg.role === 'user' ? 'flex justify-end' : 'space-y-2'}>
                {msg.role === 'user' ? (
                  <div className="max-w-[85%] btn-soft px-3.5 py-2.5 rounded-2xl rounded-br-md text-[13px] leading-relaxed">{msg.content}</div>
                ) : (
                  <>
                    <div className={`max-w-[92%] px-3.5 py-2.5 rounded-2xl rounded-bl-md border ${msg.isError ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#ECE9F5]'}`}>
                      <FormattedMarkdown content={msg.content} />
                      {msg.ticket && (
                        <p className="mt-2 inline-flex text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">Ticket {msg.ticket}</p>
                      )}
                    </div>
                    {msg.actions?.map((action, i) => (
                      <ActionView key={i} action={action} isGuest={isGuest} cartCourseIds={cartCourseIds} onAddToCart={addToCart} />
                    ))}
                  </>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="inline-flex items-center gap-2 bg-white border border-[#ECE9F5] rounded-2xl px-3.5 py-2.5 text-[13px] text-ink-muted">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
              </div>
            )}

            {showChips && (
              <div className="flex flex-wrap gap-2 pt-1">
                {chips.map(chip => (
                  <button key={chip} onClick={() => send(chip)} className="text-[13px] font-medium text-ink bg-white border border-[#E2DEEF] hover:border-[#CFC8E6] rounded-full px-3 min-h-9 transition">
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={e => { e.preventDefault(); send(); }}
            className="p-3 border-t border-[#F0EEF6] bg-white flex items-center gap-2"
          >
            <label htmlFor="agent-dock-input" className="sr-only">Message</label>
            <input
              id="agent-dock-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={onboarding ? 'Type your answer…' : tab === 'guide' ? 'Ask the guide…' : 'Describe your issue…'}
              maxLength={2000}
              className="flex-1 min-w-0 h-11 px-4 rounded-full bg-[#FBFAFF] border border-[#E2DEEF] text-sm text-ink placeholder:text-zinc-400 focus:outline-none focus:border-ink-muted"
            />
            <button type="submit" disabled={isLoading || !input.trim()} aria-label="Send" className="w-11 h-11 rounded-full btn-soft flex items-center justify-center disabled:opacity-40 transition shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function ActionView({ action, isGuest, cartCourseIds, onAddToCart }: { action: DockAction; isGuest: boolean; cartCourseIds: string[]; onAddToCart: (id: string) => void }) {
  if (action.type === 'profile_saved') {
    return <p className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Preferences saved</p>;
  }
  if (action.type === 'link') {
    return (
      <Link href={action.href} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full btn-soft text-[13px] font-semibold transition">
        {action.label} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    );
  }
  if (action.type === 'cart') {
    return isGuest ? (
      <p className="text-xs text-ink-muted">Sign in to add &ldquo;{action.title}&rdquo; to your cart.</p>
    ) : (
      <p className="text-xs font-semibold text-ink bg-white border border-[#E2DEEF] rounded-full px-3 py-1.5 inline-flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Added &ldquo;{action.title}&rdquo; to your cart</p>
    );
  }
  return (
    <div className="space-y-2">
      {action.items.map(item => {
        const inCart = cartCourseIds.includes(item.id);
        return (
          <div key={item.slug} className="bg-white border border-[#ECE9F5] rounded-2xl p-3 flex gap-3">
            <img src={item.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-ink text-[13px] leading-snug line-clamp-2">{item.title}</p>
              <p className="text-xs text-ink-muted mt-0.5 flex items-center gap-1.5">
                <span className="font-semibold text-ink">₹{item.discountPrice || item.price}</span>
                <span className="inline-flex items-center gap-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{item.rating}</span>
              </p>
              <p className="text-xs text-ink-body mt-1 leading-snug">{item.reason}</p>
              <div className="flex gap-2 mt-2">
                <Link href={`/course/${item.slug}`} className="h-8 px-3 rounded-full bg-lavender text-ink text-xs font-semibold flex items-center hover:bg-[#E2E5FF] transition">View</Link>
                {!isGuest && (
                  <button
                    onClick={() => onAddToCart(item.id)}
                    disabled={inCart}
                    className="h-8 px-3 rounded-full btn-soft text-xs font-semibold flex items-center gap-1 disabled:bg-emerald-50 disabled:text-emerald-800 transition"
                  >
                    {inCart ? <><Check className="w-3.5 h-3.5" /> In cart</> : <><ShoppingBag className="w-3.5 h-3.5" /> Add to cart</>}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
