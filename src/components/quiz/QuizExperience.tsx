'use client';

import { ArrowLeft, ArrowRight, Check, Clock, Info } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArchDecor, LeafSprig } from '@/components/brand/Decor';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/cart/store';
import { cn } from '@/lib/cn';
import { emptyAnswers, QUIZ_QUESTIONS, type QuizAnswers } from '@/lib/quiz/config';
import { quizPicks, rankCups, suggestedMix, tasteProfile, toggleAnswer } from '@/lib/quiz/score';
import type { Product } from '@/lib/types';
import { QuizHero } from './QuizHero';
import { packshot, QuizResults } from './QuizResults';
import { QuizStepper } from './QuizStepper';

export interface QuizBundle {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
}

const LAST = QUIZ_QUESTIONS.length - 1;
const PREVIEW_BADGES = ['Great match', 'Also great', 'A good match'];
const RESULT_BADGES = { best: 'Best match', also: 'Also great', discovery: 'A new discovery' } as const;

/** Find Your Match: intro, six questions, then results with the suggested 5-cup Mix Box. */
export function QuizExperience({ cups, bundle, boxSize }: { cups: Product[]; bundle: QuizBundle | null; boxSize: number }) {
  // null = intro; 0..5 = question; 6 = results
  const [step, setStep] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>(emptyAnswers);
  const [addedAll, setAddedAll] = useState(false);
  const addBox = useCart((s) => s.addBox);
  const questionRef = useRef<HTMLDivElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);

  const ranked = useMemo(() => rankCups(cups, answers), [cups, answers]);
  const picks = useMemo(() => quizPicks(ranked), [ranked]);
  const mix = useMemo(() => suggestedMix(ranked, boxSize), [ranked, boxSize]);
  const answered = QUIZ_QUESTIONS.map((q) => answers[q.id].length > 0);

  const done = step !== null && step > LAST;
  const question = step !== null && !done ? QUIZ_QUESTIONS[step] : null;
  const picked = question ? answers[question.id] : [];
  const full = question !== null && question.max > 1 && picked.length >= question.max;
  const mixCount = mix.reduce((n, m) => n + m.quantity, 0);
  const sample = useMemo(
    () => [...cups].sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller) || a.sortOrder - b.sortOrder).slice(0, 2),
    [cups],
  );

  // Keep the new question (or the results) in view after moving on, without jumping on first load.
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (done) {
      resultsHeading.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      resultsHeading.current?.focus({ preventScroll: true });
      return;
    }
    const el = questionRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, [step, done]);

  function go(next: number | null) {
    moved.current = true;
    setStep(next);
  }

  function pick(id: string) {
    if (!question) return;
    setAnswers((a) => ({ ...a, [question.id]: toggleAnswer(question, a[question.id], id) }));
    setAddedAll(false);
  }

  function restart() {
    setAnswers(emptyAnswers());
    setAddedAll(false);
    go(0);
  }

  function addAll() {
    if (!bundle || mixCount < boxSize) return;
    addBox({
      ...bundle,
      cups: mix.map(({ product, quantity }) => ({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        flavour: product.flavour,
        image: packshot(product),
        unitPrice: product.price,
        quantity,
      })),
    });
    setAddedAll(true);
  }

  const profile = tasteProfile(answers);
  const resultsCopy = done
    ? {
        eyebrow: 'Your MAGO match',
        title: 'Perfect flavours for you.',
        body: 'Based on your answers, here are your personalised MAGO cups. A mix of flavours made for your taste, your lifestyle, and your brighter days.',
      }
    : step === null
      ? {
          eyebrow: 'Your quiz results will include:',
          title: 'A perfect match, just for you.',
          body: `Get a primary match, alternative options, and a suggested ${boxSize}-cup mix, all tailored to your taste, lifestyle and preferences.`,
        }
      : {
          eyebrow: 'Your taste profile',
          title: profile?.title ?? 'Perfect flavours for you.',
          body: profile?.body ?? 'Pick your favourite flavours and your best matches will appear here as you go.',
        };

  return (
    <div className="bg-cream-light">
      <QuizHero started={step !== null} />

      <section
        aria-label="Find your match quiz"
        className="relative isolate overflow-hidden border-t border-forest/5 bg-[radial-gradient(ellipse_at_50%_0%,#fffaf1_0%,#fbf0de_70%)] px-4 pt-7 pb-9 md:pt-10 md:pb-12"
      >
        <LeafSprig className="pointer-events-none absolute top-10 -left-7 -z-10 hidden w-28 -rotate-[30deg] text-forest-light md:block lg:w-36" />
        <LeafSprig className="pointer-events-none absolute -right-6 bottom-10 -z-10 hidden w-28 rotate-[20deg] text-leaf md:block lg:w-36" />
        <ArchDecor tone="peach" className="pointer-events-none absolute -bottom-12 -left-8 -z-10 w-24 opacity-60 md:w-32" />
        <ArchDecor tone="sage" className="pointer-events-none absolute top-24 -right-10 -z-10 hidden w-28 opacity-60 lg:block" />

        <QuizStepper
          questions={QUIZ_QUESTIONS}
          current={step}
          answered={answered}
          onSelect={go}
          onPrev={question ? () => go(step === 0 ? null : step! - 1) : done ? () => go(LAST) : undefined}
          onNext={question ? () => go(step! + 1) : undefined}
          nextDisabled={!picked.length}
        />

        {step === null ? (
          <div className="mt-8 text-center">
            <Button size="lg" className="w-full max-w-sm" onClick={() => go(0)}>
              Start the quiz <ArrowRight size={20} aria-hidden />
            </Button>
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-ink/75">
              <Clock size={16} aria-hidden /> Takes less than 2 minutes
            </p>
          </div>
        ) : question ? (
          <div ref={questionRef} className="mx-auto mt-7 max-w-5xl scroll-mt-24 md:mt-9">
            <div className="text-center">
              <h2 id="quiz-question" className="font-display text-xl leading-tight font-bold text-forest uppercase sm:text-2xl md:text-3xl">
                {step! + 1}. {question.title}
              </h2>
              <p className="mt-1 text-sm text-ink/75 md:text-base">{question.hint}</p>
            </div>

            <div
              role="group"
              aria-labelledby="quiz-question"
              className="mx-auto mt-6 flex max-w-5xl flex-wrap justify-center gap-x-2 gap-y-5 sm:gap-x-5 md:mt-8 lg:gap-x-6"
            >
              {question.options.map((o) => {
                const on = picked.includes(o.id);
                const locked = full && !on;
                return (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={on}
                    aria-disabled={locked || undefined}
                    onClick={() => pick(o.id)}
                    className={cn(
                      'group flex w-[30%] max-w-[150px] flex-col items-center gap-2 text-center sm:w-[130px] lg:w-[140px]',
                      locked && 'opacity-55',
                    )}
                  >
                    <span
                      className={cn(
                        'relative block aspect-square w-full rounded-full p-1 transition duration-200',
                        on ? 'bg-forest shadow-[0_6px_18px_rgba(2,48,37,0.25)]' : 'bg-[#f3d2a6] group-hover:bg-saffron/70',
                      )}
                    >
                      <span className="relative block size-full overflow-hidden rounded-full border-[3px] border-cream-light">
                        <Image
                          src={o.image}
                          alt=""
                          fill
                          loading="eager"
                          sizes="(min-width: 1024px) 140px, (min-width: 640px) 130px, 30vw"
                          className={cn('object-cover transition duration-300', !locked && 'group-hover:scale-105')}
                        />
                      </span>
                      {on ? (
                        <span className="absolute -top-0.5 -right-0.5 grid size-7 place-items-center rounded-full border-2 border-cream-light bg-forest text-white md:size-8">
                          <Check size={16} strokeWidth={3} aria-hidden />
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[13px] leading-tight font-semibold text-forest md:text-[15px]">{o.label}</span>
                  </button>
                );
              })}
            </div>

            {question.note ? (
              <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-ink/75 md:text-sm">
                <Info size={15} aria-hidden /> {question.note}
              </p>
            ) : null}

            <div className="mx-auto mt-7 flex max-w-md items-center gap-3">
              {step! > 0 ? (
                <button
                  type="button"
                  onClick={() => go(step! - 1)}
                  className="grid size-12 shrink-0 place-items-center rounded-full bg-cream-light text-forest shadow-sm ring-1 ring-forest/20 hover:bg-white"
                  aria-label="Back to the previous question"
                >
                  <ArrowLeft size={20} aria-hidden />
                </button>
              ) : null}
              <Button size="lg" className="h-12 min-w-0 flex-1" disabled={!picked.length} onClick={() => go(step! + 1)}>
                {step === LAST ? 'See my match' : 'Next'} <ArrowRight size={20} aria-hidden />
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-6 text-center text-sm text-ink/75">
            <p className="font-display text-lg font-bold text-forest">All done! Here are your matches.</p>
          </div>
        )}
      </section>

      <QuizResults
        phase={done ? 'done' : step === null ? 'intro' : 'quiz'}
        picks={picks.map((p, i) => ({ product: p.product, badge: done ? RESULT_BADGES[p.kind] : PREVIEW_BADGES[i] }))}
        {...resultsCopy}
        sample={sample}
        mix={mix}
        boxSize={boxSize}
        canAddAll={bundle !== null && mixCount >= boxSize}
        addedAll={addedAll}
        bestValue={answers.priority.includes('value')}
        onAddAll={addAll}
        onRetake={restart}
        headingRef={resultsHeading}
      />

      <p className="sr-only" aria-live="polite">
        {done ? 'Quiz complete. Your matches are ready.' : question ? `Question ${step! + 1} of ${QUIZ_QUESTIONS.length}` : ''}
      </p>
    </div>
  );
}
