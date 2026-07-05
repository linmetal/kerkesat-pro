import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const stats = [
  { label: 'Projects Completed', value: 480, suffix: '+' },
  { label: 'Countries Active', value: 12, suffix: '' },
  { label: 'Square Meters Designed', value: 15, suffix: 'M+' },
  { label: 'Client Retention', value: 96, suffix: '%' },
  { label: 'Industry Awards', value: 34, suffix: '' },
  { label: 'Studio Members', value: 260, suffix: '+' },
];

const bars = [38, 52, 61, 74, 88, 100];

export default function StatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const counterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const barRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      stats.forEach((s, i) => {
        const el = counterRefs.current[i];
        if (!el) return;
        const proxy = { val: 0 };
        gsap.fromTo(
          el,
          { filter: 'blur(14px)', opacity: 0 },
          {
            filter: 'blur(0px)',
            opacity: 1,
            duration: 1,
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          }
        );
        gsap.to(proxy, {
          val: s.value,
          duration: 1.4,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          onUpdate: () => {
            el.textContent = Math.round(proxy.val).toString();
          },
        });
      });

      barRefs.current.forEach((bar, i) => {
        if (!bar) return;
        gsap.fromTo(
          bar,
          { height: '0%' },
          {
            height: `${bars[i]}%`,
            duration: 1.2,
            ease: 'power3.out',
            delay: i * 0.06,
            scrollTrigger: { trigger: bar, start: 'top 90%', toggleActions: 'play none none reverse' },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="stats"
      className="section relative w-full bg-graphite px-6 py-32 sm:px-10 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow mb-6">05 — By the Numbers</p>
        <h2 className="font-display mb-16 max-w-2xl text-balance text-4xl leading-tight tracking-tightest text-platinum sm:text-5xl">
          Scale that speaks for itself.
        </h2>

        <div className="grid grid-cols-2 gap-x-8 gap-y-14 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s, i) => (
            <div key={s.label}>
              <div className="font-display flex items-baseline text-4xl text-platinum sm:text-5xl">
                <span
                  ref={(el) => {
                    counterRefs.current[i] = el;
                  }}
                >
                  0
                </span>
                <span className="text-2xl text-signal">{s.suffix}</span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-widest text-steel">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-24 flex h-48 items-end gap-3 border-b border-white/10 pb-0 sm:gap-6">
          {bars.map((_, i) => (
            <div key={i} className="flex h-full flex-1 flex-col justify-end">
              <div
                ref={(el) => {
                  barRefs.current[i] = el;
                }}
                className="w-full rounded-t-md bg-gradient-to-t from-signal/20 to-signal"
                style={{ height: '0%' }}
              />
              <span className="mt-3 text-center text-[10px] uppercase tracking-widest text-steel">
                {2020 + i}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
