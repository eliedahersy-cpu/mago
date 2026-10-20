/** Leaf-and-arch artwork down both sides of every page (from the supplied pattern), behind the content. */
const strip = 'pointer-events-none absolute inset-y-0 -z-10 hidden w-[280px] min-[1000px]:block';
const style = (name: string) => ({
  backgroundImage: `url(/images/decor/side-${name}.webp)`,
  backgroundRepeat: 'repeat-y',
  backgroundSize: '280px auto',
  backgroundPosition: name === 'left' ? 'left top' : 'right top',
});

export function PageSides({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col">
      <div aria-hidden className={`${strip} left-0`} style={style('left')} />
      <div aria-hidden className={`${strip} right-0`} style={style('right')} />
      {children}
    </div>
  );
}
