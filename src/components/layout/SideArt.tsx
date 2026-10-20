/** Artwork down both sides of a page, behind its content (needs an `isolate` parent). Shown from 1280px wide, at one fixed size so it looks the same on every screen. */
const strip = 'pointer-events-none absolute inset-y-0 -z-10 hidden w-[clamp(0px,calc((100vw-1400px)/2),280px)] min-[1480px]:block';
const style = (name: string, side: 'left' | 'right') => ({
  backgroundImage: `url(/images/decor/${name}-${side}.webp)`,
  backgroundRepeat: 'repeat-y',
  backgroundSize: '280px auto',
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
