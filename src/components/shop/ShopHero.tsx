/** "Our pasta cups" banner: real heading and line over the approved artwork (arch and leaves left, a cup right; phones put the cup under the text). */
export function ShopHero() {
  return (
    <section className="relative isolate overflow-hidden max-md:bg-[#fcf0d9]">
      {/* Phones: the leaves and arch of the approved design around the title. */}
      <div aria-hidden className="pointer-events-none absolute top-0 left-0 -z-10 h-[36%] w-[13%] bg-[url('/images/shop-deco-left.webp')] bg-cover bg-top [mask-image:linear-gradient(to_right,#000_55%,transparent),linear-gradient(to_bottom,#000_70%,transparent)] [mask-composite:intersect] md:hidden" />
      <div aria-hidden className="pointer-events-none absolute top-0 right-0 -z-10 h-[30%] w-[11%] bg-[url('/images/shop-deco-right.webp')] bg-cover bg-top [mask-image:linear-gradient(to_left,#000_55%,transparent),linear-gradient(to_bottom,#000_70%,transparent)] [mask-composite:intersect] md:hidden" />
      <div className="mx-auto grid max-w-[2560px] md:min-h-[clamp(300px,33vw,760px)] md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div className="relative z-10 px-9 pt-10 pb-2 text-center md:flex md:flex-col md:justify-center md:py-12 md:pr-0 md:pl-[max(3rem,6vw)] xl:pl-[max(6vw,calc((100vw-1400px)/2+3rem))] min-[900px]:pl-[max(2.5rem,clamp(0px,calc(280px - 4vw),280px))] md:text-left">
          <h1 className="font-display text-[clamp(2.8rem,12.5vw,3.8rem)] leading-[0.95] font-bold text-forest uppercase md:text-[clamp(2.6rem,4.9vw,6.4rem)]">
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
              height={734}
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
