'use client';

import { Mic, MicOff, Send, Square, Volume2, VolumeX, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SunMark } from '@/components/brand/Decor';
import {
  type AssistantEvent,
  type AssistantProduct,
  type ChatTurn,
  MAX_TURN_CHARS,
  MAX_TURNS,
  speakableText,
  visibleText,
} from '@/lib/assistant/shared';
import { cutoutImage } from '@/lib/catalog/cutout';
import { useCart } from '@/lib/cart/store';
import { cn } from '@/lib/cn';

const WELCOME = "Hey, pasta lover! ☀️ I'm your MAGO girl. Looking for your perfect pasta match, a delicious recipe, or just curious about MAGO?";
const ACTIONS = ['Find My MAGO Match', 'Explore MAGO Cups', 'Discover Pasta Recipes', 'Ask About MAGO'];
const LANGS = [
  { code: 'en-US', label: 'EN' },
  { code: 'ar-LB', label: 'عربي' },
  { code: 'fr-FR', label: 'FR' },
] as const;
type Lang = (typeof LANGS)[number]['code'];
const STORAGE_KEY = 'mago-ai-chat-v1';
const HIDDEN_ON = ['/checkout', '/subscribe/build'];

interface Bubble {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  products?: AssistantProduct[];
  /** Not sent back to the model (failed turns and error notes). */
  local?: boolean;
}

// Minimal Web Speech API types (not in TypeScript's DOM library).
interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}
interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: RecognitionResultEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const FEMININE = /female|woman|samantha|zira|aria|jenny|sonia|libby|natasha|emma|ava|allison|susan|karen|moira|tessa|fiona|victoria|amelie|amélie|denise|audrey|marie|julie|hortense|celine|hoda|salma|zariyah|layla|laila|mariam|google/i;

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  const prefix = lang.slice(0, 2);
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(prefix));
  return voices.find((v) => v.lang === lang && FEMININE.test(v.name)) ?? voices.find((v) => FEMININE.test(v.name)) ?? voices[0] ?? null;
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

/** The turns the model sees: no local notes, starting with the customer, at most MAX_TURNS. */
function history(bubbles: Bubble[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (const b of bubbles) {
    if (b.local) continue;
    const text = b.role === 'assistant' ? b.text.slice(0, MAX_TURN_CHARS * 4) : b.text;
    if (!text.trim()) continue;
    if (turns.length && turns[turns.length - 1].role === b.role) turns[turns.length - 1] = { role: b.role, text };
    else turns.push({ role: b.role, text });
  }
  let start = Math.max(0, turns.length - MAX_TURNS);
  while (start < turns.length && turns[start].role !== 'user') start++;
  return turns.slice(start);
}

function ProductCard({ product }: { product: AssistantProduct }) {
  const add = useCart((s) => s.add);
  const image = product.image ? cutoutImage(product.image) : null;
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-cream-light p-2.5 shadow-sm ring-1 ring-forest/10">
      <Link href={`/shop/${product.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#f3e4cf]">
        {image ? <Image src={image} alt="" fill sizes="64px" className="object-contain p-1 mix-blend-multiply" /> : null}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/shop/${product.slug}`} className="block font-display text-sm leading-tight font-bold text-forest hover:underline">
          {product.name}
        </Link>
        {product.flavour ? <p className="truncate text-xs text-ink/70">{product.flavour}</p> : null}
        <p className="mt-0.5 text-sm font-semibold text-terracotta">${product.price.toFixed(2)}</p>
      </div>
      <button
        type="button"
        disabled={!product.purchasable}
        onClick={() =>
          add({ productId: product.productId, slug: product.slug, name: product.name, flavour: product.flavour, image: product.image, unitPrice: product.price })
        }
        className="shrink-0 rounded-full bg-forest px-3 py-2 text-xs font-bold tracking-wide text-cream-light uppercase hover:bg-forest-light disabled:bg-forest/30"
      >
        {product.purchasable ? 'Add' : 'Sold out'}
      </button>
    </li>
  );
}

export function MagoAssistant() {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<Lang>('en-US');
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<Recognition | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const voiceRef = useRef(false);
  const openRef = useRef(false);
  const sendRef = useRef<(text: string) => void>(() => {});

  voiceRef.current = voiceOn;
  openRef.current = open;

  useEffect(() => {
    try {
      if (bubbles.length) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bubbles.slice(-40)));
    } catch {
      /* storage unavailable */
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [bubbles]);

  // The panel only renders after a click, so reading the browser here never mismatches the server render.
  const canListen = open && recognitionCtor() !== null;

  const openPanel = () => {
    if (bubbles.length === 0) {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) setBubbles(JSON.parse(saved) as Bubble[]);
      } catch {
        /* private mode: start fresh */
      }
    }
    setOpen(true);
  };

  const stopListening = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const listen = useCallback(() => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    stopSpeaking();
    recognitionRef.current?.abort();
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = '';
    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else interim += r[0].transcript;
      }
      setInput((finalText + interim).trim());
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setVoiceOn(false);
        setBubbles((b) => [...b, { id: newId(), role: 'assistant', text: 'I need microphone permission to hear you. You can keep typing too!', local: true }]);
      }
    };
    rec.onend = () => {
      setListening(false);
      if (recognitionRef.current === rec) recognitionRef.current = null;
      const text = finalText.trim();
      if (text) sendRef.current(text);
    };
    recognitionRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  }, [lang, stopSpeaking]);

  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) return;
      const said = speakableText(text);
      if (!said) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(said);
      utterance.lang = lang;
      const voice = pickVoice(lang);
      if (voice) utterance.voice = voice;
      utterance.rate = 1.03;
      utterance.pitch = 1.08;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        // Continuous conversation: listen again once she has finished talking.
        if (voiceRef.current && openRef.current) listen();
      };
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    },
    [lang, listen],
  );

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_TURN_CHARS);
      if (!text || busy) return;
      stopSpeaking();
      setInput('');
      const userBubble: Bubble = { id: newId(), role: 'user', text };
      const replyId = newId();
      const turns = history([...bubbles, userBubble]);
      setBubbles((b) => [...b, userBubble, { id: replyId, role: 'assistant', text: '' }]);
      setBusy(true);
      const controller = new AbortController();
      abortRef.current = controller;
      let full = '';
      const fail = (message: string) =>
        setBubbles((b) =>
          b.map((x) => (x.id === replyId ? { ...x, text: message, local: true } : x.id === userBubble.id ? { ...x, local: true } : x)),
        );
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: turns }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          fail(data?.error ?? 'Oops, something went wrong. Please try again.');
          return;
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let errored = false;
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line) as AssistantEvent;
            if (event.type === 'text') {
              full += event.text;
              setBubbles((b) => b.map((x) => (x.id === replyId ? { ...x, text: full } : x)));
            } else if (event.type === 'products') {
              setBubbles((b) => b.map((x) => (x.id === replyId ? { ...x, products: event.products } : x)));
            } else if (event.type === 'error') {
              errored = true;
              fail(event.message);
            }
          }
        }
        if (!errored && full.trim() && voiceRef.current) speak(full);
        else if (!errored && !full.trim()) fail('Sorry, I lost my train of thought. Could you say that again?');
      } catch {
        if (!controller.signal.aborted) fail('I could not reach the kitchen. Check your connection and try again.');
        else if (!full.trim()) setBubbles((b) => b.filter((x) => x.id !== replyId));
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [bubbles, busy, speak, stopSpeaking],
  );
  sendRef.current = (text) => void send(text);

  const stopAll = () => {
    abortRef.current?.abort();
    stopListening();
    stopSpeaking();
  };

  const close = () => {
    stopAll();
    setVoiceOn(false);
    setOpen(false);
  };

  const toggleVoice = () => {
    if (voiceOn) {
      setVoiceOn(false);
      stopListening();
      stopSpeaking();
      return;
    }
    setVoiceOn(true);
    voiceRef.current = true;
    if (bubbles.length === 0) speak(WELCOME);
    else listen();
  };

  const micPress = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    // Interrupt: stop talking and listen to the new request.
    abortRef.current?.abort();
    listen();
  };

  useEffect(() => () => stopAll(), []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={openPanel}
          className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-4 z-40 flex items-center gap-2 rounded-full bg-forest py-2.5 pr-5 pl-3 font-display text-sm font-bold tracking-wide text-cream-light uppercase shadow-[0_10px_30px_rgba(2,48,37,0.35)] ring-2 ring-sun/70 hover:bg-forest-light motion-safe:animate-[mago-fab-in_.35s_ease_both]"
          aria-haspopup="dialog"
        >
          <SunMark className="w-7" />
          Ask MAGO
        </button>
      ) : null}

      {open ? (
        <section
          role="dialog"
          aria-label="MAGO AI assistant"
          className="fixed inset-x-2 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-50 flex h-[min(640px,calc(100dvh-1rem))] flex-col overflow-hidden rounded-3xl bg-cream shadow-[0_24px_60px_rgba(2,48,37,0.35)] ring-1 ring-forest/15 sm:inset-x-auto sm:left-4 sm:w-[400px]"
          onKeyDown={(e) => e.key === 'Escape' && close()}
        >
          <header className="flex items-center gap-3 bg-forest px-4 py-3 text-cream-light">
            <SunMark className="w-9 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg leading-none font-bold uppercase">MAGO AI</p>
              <p className="mt-0.5 truncate text-xs text-cream-light/75">
                {listening ? 'Listening…' : speaking ? 'Speaking…' : busy ? 'Thinking…' : 'Your MAGO girl · pasta advisor'}
              </p>
            </div>
            <label className="sr-only" htmlFor="mago-ai-lang">
              Language
            </label>
            <select
              id="mago-ai-lang"
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              className="rounded-full bg-forest-light px-2 py-1 text-xs font-semibold text-cream-light outline-none"
            >
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            {canListen ? (
              <button
                type="button"
                onClick={toggleVoice}
                aria-pressed={voiceOn}
                aria-label={voiceOn ? 'Turn voice mode off' : 'Turn voice mode on'}
                title={voiceOn ? 'Voice mode on' : 'Voice mode'}
                className={cn('rounded-full p-2 hover:bg-forest-light', voiceOn && 'bg-sun text-forest hover:bg-sun')}
              >
                {voiceOn ? <Volume2 size={18} aria-hidden /> : <VolumeX size={18} aria-hidden />}
              </button>
            ) : null}
            <button type="button" onClick={close} aria-label="Close MAGO AI" className="rounded-full p-2 hover:bg-forest-light">
              <X size={18} aria-hidden />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-cream-light px-4 py-3 text-sm leading-relaxed text-ink shadow-sm">{WELCOME}</div>
            {bubbles.length === 0 ? (
              <div className="flex flex-wrap gap-2">
                {ACTIONS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => void send(a)}
                    className="rounded-full bg-cream-light px-3.5 py-2 text-xs font-semibold text-forest ring-1 ring-forest/20 hover:bg-cream-dark"
                  >
                    {a}
                  </button>
                ))}
              </div>
            ) : null}
            {bubbles.map((b) => {
              const shown = b.role === 'assistant' ? visibleText(b.text).replace(/\*\*/g, '') : b.text;
              return (
                <div key={b.id} className={cn('flex flex-col gap-2', b.role === 'user' ? 'items-end' : 'items-start')}>
                  {shown || b.role === 'user' ? (
                    <p
                      dir="auto"
                      className={cn(
                        'max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm',
                        b.role === 'user' ? 'rounded-tr-md bg-terracotta text-cream-light' : 'rounded-tl-md bg-cream-light text-ink',
                      )}
                    >
                      {shown}
                    </p>
                  ) : (
                    <p className="flex gap-1 rounded-2xl rounded-tl-md bg-cream-light px-4 py-4 shadow-sm" aria-label="MAGO AI is typing">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="size-2 rounded-full bg-forest/50 motion-safe:animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </p>
                  )}
                  {b.products?.length ? (
                    <ul className="w-full max-w-[94%] space-y-2">
                      {b.products.map((p) => (
                        <ProductCard key={p.slug} product={p} />
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>

          <form
            className="flex items-end gap-2 border-t border-forest/10 bg-cream-light px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            {canListen ? (
              <button
                type="button"
                onClick={micPress}
                aria-label={listening ? 'Stop listening' : 'Speak'}
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-full text-forest ring-1 ring-forest/20 hover:bg-cream-dark',
                  listening && 'bg-terracotta text-cream-light ring-0 motion-safe:animate-pulse hover:bg-terracotta',
                )}
              >
                {listening ? <MicOff size={19} aria-hidden /> : <Mic size={19} aria-hidden />}
              </button>
            ) : null}
            <textarea
              ref={inputRef}
              dir="auto"
              rows={1}
              value={input}
              maxLength={MAX_TURN_CHARS}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder={listening ? 'Listening…' : 'Ask me anything about MAGO…'}
              aria-label="Message MAGO AI"
              className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl bg-cream px-4 py-3 text-sm text-ink outline-none placeholder:text-ink/45 focus-visible:ring-2 focus-visible:ring-saffron"
            />
            {busy || speaking ? (
              <button type="button" onClick={stopAll} aria-label="Stop" className="grid size-11 shrink-0 place-items-center rounded-full bg-terracotta text-cream-light hover:bg-terracotta-light">
                <Square size={16} aria-hidden />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-forest text-cream-light hover:bg-forest-light disabled:bg-forest/30"
              >
                <Send size={17} aria-hidden />
              </button>
            )}
          </form>
          <p className="bg-cream-light px-4 pb-2 text-center text-[10px] text-ink/50">MAGO AI can make mistakes. Check the pack label for allergens.</p>
        </section>
      ) : null}
    </>
  );
}
