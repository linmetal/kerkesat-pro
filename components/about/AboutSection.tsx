import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollProgress } from '@/lib/scrollProgress';

const AboutScene = dynamic(() => import('./AboutScene'), { ssr: false });

const milestones = [
  { year: '2011', label: 'Studio Founded', value: 1, suffix: '', desc: 'Two engineers, one drafting table, a conviction that buildings could think.' },
  { year: '2016', label: 'Projects Delivered', value: 48, suffix: '+', desc: 'From coastal towers to underground transit halls — precision at every scale.' },
  { year: '2020', label: 'Countries Active', value: 12, suffix: '', desc: 'ADHAX teams embed on-site across four continents.' },
  { year: '2024', label: 'Million m² Designed', value: 1.2, suffix: 'M', desc: 'Every square meter modeled, simulated, and stress-tested before groundbreak.' },
  { year: 'Today', label: 'Engineers & Architects', value: 260, suffix: '+', desc: 'A single studio, obsessed with the same standard of excellence.' },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=250%',
        scrub: 1,
        pin: true,
        onUpdate: (self) => {
          scrollProgress.about = self.progress;
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=250%',
          scrub: 1,
        },
      });

      milestones.forEach((m, i) => {
        const start = i / milestones.length;
        const el = itemRefs.current[i];
        const counter = counterRefs.current[i];
        if (el) {
          tl.fromTo(
            el,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.16, ease: 'power2.out' },
            start
          );
          if (i < milestones.length - 1) {
            tl.to(el, { opacity: 0, y: -24, duration: 0.1, ease: 'power1.in' }, start + 0.15);
          }
        }
        if (counter) {
          const proxy = { val: 0 };
          tl.to(
            proxy,
            {
              val: m.value,
              duration: 0.13,
              ease: 'power1.out',
              onUpdate: () => {
                counter.textContent = m.value < 10 && m.value % 1 !== 0
                  ? proxy.val.toFixed(1)
                  : Math.round(proxy.val).toString();
              },
            },
            start
          );
        }
      });

      return () => {
        st.kill();
      };
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="section relative h-[100svh] w-full overflow-hidden bg-void"
    >
      <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-2">
        <div className="relative flex flex-col justify-center px-8 py-24 sm:px-14 lg:px-20">
          <p className="eyebrow mb-6">01 — About</p>
          <h2 className="font-display mb-12 max-w-lg text-balance text-4xl leading-tight tracking-tightest text-platinum sm:text-5xl">
            Blueprints become buildings. Buildings become landmarks.
          </h2>

          <div className="relative h-[280px]">
            {milestones.map((m, i) => (
              <div
                key={m.year}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className="absolute inset-0 opacity-0"
              >
                <span className="eyebrow text-signal">{m.year}</span>
                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    ref={(el) => {
                      counterRefs.current[i] = el;
                    }}
                    className="font-display text-6xl text-platinum sm:text-7xl"
                  >
                    0
                  </span>
                  <span className="font-display text-3xl text-steel">{m.suffix}</span>
                </div>
                <p className="mt-2 text-lg text-mist">{m.label}</p>
                <p className="mt-4 max-w-sm text-balance text-sm text-steel">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden lg:block">
          <AboutScene />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-void" />
        </div>
      </div>
    </section>
  );
}
