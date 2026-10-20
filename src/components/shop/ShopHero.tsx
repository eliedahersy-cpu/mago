/** "Our pasta cups" banner: real heading and line over the approved artwork (arch and leaves left, a cup right; phones put the cup under the text). */
export function ShopHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="mx-auto grid max-w-[2560px] md:min-h-[clamp(300px,33vw,760px)] md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="relative z-10 px-6 pt-10 pb-2 text-center md:flex md:flex-col md:justify-center md:py-12 md:pr-0 md:pl-[max(4rem,12vw)] md:text-left">
          <h1 className="font-display text-[clamp(2.6rem,11vw,3.4rem)] leading-[0.95] font-bold text-forest uppercase md:text-[clamp(2.6rem,4.9vw,6.4rem)]">
            Our pasta
            <br className="md:hidden" /> cups
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-lg leading-snug font-medium text-ink/85 md:mx-0 md:max-w-[28rem] md:text-[clamp(1.1rem,1.6vw,2.2rem)]">
            Life&rsquo;s easier, tastier and healthier with a <strong className="font-bold text-forest">MAGO</strong> cup.
          </p>
        </div>
        <div className="relative">
          <picture>
            <source media="(min-width: 768px)" srcSet="/images/shop-head-right.webp" width={700} height={533} />
            <img
              src="/images/shop-head-mobile.webp"
              width={1254}
              height={694}
              alt="A MAGO pasta cup full of spicy fusilli"
              loading="eager"
              fetchPriority="high"
              className="block h-auto w-full [mask-image:linear-gradient(to_bottom,transparent,#000_6%)] md:absolute md:inset-0 md:h-full md:object-cover md:object-left md:[mask-image:linear-gradient(to_right,transparent,#000_8%)]"
            />
          </picture>
        </div>
      </div>
    </section>
  );
}
