/** Artwork down both sides of a page, behind its content (needs an `isolate` parent). Shown from 1240px wide. */
const strip = 'pointer-events-none absolute inset-y-0 -z-10 hidden w-[clamp(0px,calc((100vw-1240px)/2+60px),420px)] min-[1240px]:block';
const style = (name: string, side: 'left' | 'right') => ({
  backgroundImage: `url(/images/decor/${name}-${side}.webp)`,
  backgroundRepeat: 'repeat-y',
  backgroundSize: '100% auto',
  backgroundPosition: `${side} top`,
});

export function SideArt({ name }: { name: string }) {
  return (
    <>
      <div aria-hidden className={`${strip} left-0`} style={style(name, 'left')} />
      <div aria-hidden className={`${strip} right-0`} style={style(name, 'right')} />
    </>
  );
}
