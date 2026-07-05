import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import MagneticButton from '@/components/shared/MagneticButton';

const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });

export default function HeroSection() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3, defaults: { ease: 'power4.out' } });
      tl.from('.hero-eyebrow', { opacity: 0, y: 16, duration: 0.8 })
        .from(
          '.hero-line',
          { yPercent: 120, opacity: 0, duration: 1.1, stagger: 0.08 },
          '-=0.4'
        )
        .from('.hero-sub', { opacity: 0, y: 20, duration: 0.9 }, '-=0.5')
        .from('.hero-cta > *', { opacity: 0, y: 16, duration: 0.7, stagger: 0.1 }, '-=0.5')
        .from('.hero-scroll-cue', { opacity: 0, duration: 1 }, '-=0.3');
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="home"
      className="section relative h-[100svh] w-full overflow-hidden bg-void"
    >
      <div className="absolute inset-0">
        <HeroScene />
      </div>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <p className="hero-eyebrow eyebrow mb-6">Engineering the Unbuilt</p>

        <h1 className="font-display text-balance text-[13vw] leading-[0.92] tracking-tightest text-platinum sm:text-[9vw] lg:text-[7.2vw]">
          <span className="block overflow-hidden">
            <span className="hero-line block">ADHAX</span>
          </span>
          <span className="block overflow-hidden">
            <span className="hero-line block text-steel">ENTERPRISE</span>
          </span>
        </h1>

        <p className="hero-sub mt-8 max-w-xl text-balance text-base text-steel sm:text-lg">
          A studio of architects, engineers, and builders designing the
          structures the future will be measured against.
        </p>

        <div className="hero-cta pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-4">
          <MagneticButton href="#contact" variant="primary">
            Begin a Project
          </MagneticButton>
          <MagneticButton href="#projects" variant="secondary">
            Explore Work
          </MagneticButton>
        </div>
      </div>

      <div className="hero-scroll-cue absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-steel">
        <span className="eyebrow">Scroll</span>
        <span className="h-10 w-px animate-pulse bg-gradient-to-b from-steel to-transparent" />
      </div>
    </section>
  );
}
