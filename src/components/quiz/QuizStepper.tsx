import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { QuizQuestion } from '@/lib/quiz/config';

const arrow =
  'grid size-9 shrink-0 place-items-center rounded-full bg-cream-light text-forest shadow-sm ring-1 ring-forest/15 transition hover:bg-white disabled:opacity-35 md:size-11';

/**
 * Six numbered steps joined by a line. `current` is null before the quiz starts.
 * Answered steps show a tick and can be revisited; later steps open once the earlier ones are answered.
 */
export function QuizStepper({
  questions,
  current,
  answered,
  onSelect,
  onPrev,
  onNext,
  nextDisabled = false,
}: {
  questions: QuizQuestion[];
  current: number | null;
  answered: boolean[];
  onSelect: (index: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}) {
  const firstOpen = answered.indexOf(false);
  const reachable = (i: number) => current !== null && (firstOpen === -1 || i <= firstOpen);

  return (
    <nav aria-label="Quiz steps" className="mx-auto flex max-w-5xl items-start gap-1 md:gap-4">
      {onPrev ? (
        <button type="button" onClick={onPrev} className={arrow} aria-label="Previous question">
          <ChevronLeft size={20} aria-hidden />
        </button>
      ) : null}
      <ol className="flex min-w-0 flex-1 items-start">
        {questions.map((q, i) => {
          const active = i === current;
          const done = answered[i] && !active && current !== null;
          return (
            <li key={q.id} className="relative flex min-w-0 flex-1 flex-col items-center">
              {i > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-[17px] right-1/2 h-0.5 w-full md:top-[21px]',
                    answered[i - 1] && current !== null ? 'bg-forest/70' : 'bg-saffron/60',
                  )}
                />
              ) : null}
              <button
                type="button"
                disabled={!reachable(i) || active}
                onClick={() => onSelect(i)}
                aria-current={active ? 'step' : undefined}
                aria-label={`Step ${i + 1}: ${q.step}${done ? ', answered' : ''}`}
                className={cn(
                  'relative grid size-9 place-items-center rounded-full border-2 font-display text-sm font-bold transition md:size-11 md:text-base',
                  active || done ? 'border-forest bg-forest text-white' : 'border-saffron/80 bg-cream-light text-forest',
                  active && 'ring-4 ring-forest/15',
                  reachable(i) && !active && 'hover:scale-105',
                  'disabled:cursor-default',
                )}
              >
                {done ? <Check size={18} strokeWidth={3} aria-hidden /> : i + 1}
              </button>
              <span className="mt-1.5 text-center text-[10px] leading-tight font-medium text-forest sm:hidden">{q.short}</span>
              <span className="mt-2 hidden text-center text-xs leading-tight font-medium text-forest sm:block md:text-sm">{q.step}</span>
            </li>
          );
        })}
      </ol>
      {onNext ? (
        <button type="button" onClick={onNext} disabled={nextDisabled} className={cn(arrow, 'md:hidden')} aria-label="Next question">
          <ChevronRight size={20} aria-hidden />
        </button>
      ) : null}
    </nav>
  );
}
