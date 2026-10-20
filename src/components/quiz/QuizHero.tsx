import { getImageProps } from 'next/image';
import { cn } from '@/lib/cn';

const ALT =
  'Find your MAGO match. Answer a few simple questions and we’ll find your perfect pasta cups. Personalised recommendations, discover new flavours, based on your preferences, perfect for Mix & Match.';

/** "Find your MAGO match" banner from the approved artwork (wide from 768px, tall on phones). Once the quiz starts, phones hide it so the question sits higher. */
export function QuizHero({ started }: { started: boolean }) {
  const common = { alt: ALT, sizes: '(min-width: 1600px) 1600px, 100vw' };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, width: 1600, height: 800, src: '/images/quiz-art-wide.webp' });
  const {
    props: { srcSet: tall, ...img },
  } = getImageProps({ ...common, width: 900, height: 1600, src: '/images/quiz-art-tall.webp' });
  return (
    <section className={cn('bg-[#f6e6cc]', started && 'max-md:hidden')}>
      <h1 className="sr-only">Find your MAGO match</h1>
      <div className="mx-auto max-w-[1600px]">
        <picture>
          <source media="(min-width: 768px)" srcSet={wide} width={1600} height={800} />
          <img {...img} srcSet={tall} alt={ALT} loading="eager" fetchPriority="high" className="block h-auto w-full" />
        </picture>
      </div>
    </section>
  );
}
