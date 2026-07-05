import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import TiltCard from '@/components/shared/TiltCard';
import type { ServiceKind } from './ServiceObject';

const ServiceObject = dynamic(() => import('./ServiceObject'), { ssr: false });

type Service = {
  kind: ServiceKind;
  title: string;
  short: string;
  detail: string;
};

const services: Service[] = [
  {
    kind: 'architecture',
    title: 'Architecture',
    short: 'Form driven by structure, light, and intent.',
    detail:
      'From massing studies to construction documents, our architecture practice designs buildings that perform as elegantly as they read — parametric facades, daylight modeling, and material honesty in every elevation.',
  },
  {
    kind: 'engineering',
    title: 'Engineering',
    short: 'Structural, MEP, and systems precision.',
    detail:
      'Structural, mechanical, electrical, and plumbing engineering unified under one model. We simulate load paths, seismic response, and energy performance before a single beam is ordered.',
  },
  {
    kind: 'construction',
    title: 'Construction',
    short: 'Groundbreak to occupancy, on schedule.',
    detail:
      'Self-perform and general-contracting teams execute what we design, closing the gap between drawing and reality with digital twins tracking every phase on site.',
  },
  {
    kind: 'consulting',
    title: 'Consulting',
    short: 'Feasibility, risk, and strategic planning.',
    detail:
      'Site feasibility, entitlement strategy, cost modeling, and sustainability certification — the decisions that determine whether a project should exist before it does.',
  },
  {
    kind: 'management',
    title: 'Project Management',
    short: 'One team, one schedule, zero surprises.',
    detail:
      'Integrated project controls connect owners, designers, and trades in a single source of truth — budgets, schedules, and submittals tracked in real time.',
  },
  {
    kind: 'urban',
    title: 'Urban Development',
    short: 'Master planning at the scale of cities.',
    detail:
      'District-scale master planning balances density, mobility, and public space — modeling how a neighborhood will breathe for the next hundred years.',
  },
];

export default function ServicesSection() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <section id="services" className="section relative w-full bg-void px-6 py-32 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow mb-6">02 — Services</p>
        <h2 className="font-display mb-16 max-w-2xl text-balance text-4xl leading-tight tracking-tightest text-platinum sm:text-5xl">
          Six disciplines. One continuous line of thinking.
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <TiltCard
              key={s.kind}
              max={8}
              onClick={() => setActiveIdx(i)}
              className="glass-panel group relative flex h-72 cursor-pointer flex-col overflow-hidden rounded-2xl p-6"
            >
              <div
                className="absolute inset-0 -z-0 opacity-90"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <ServiceObject kind={s.kind} hovered={hoveredIdx === i} />
              </div>
              <div className="relative z-10 mt-auto">
                <h3 className="font-display text-2xl text-platinum">{s.title}</h3>
                <p className="mt-2 text-sm text-steel">{s.short}</p>
              </div>
              <span className="relative z-10 mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-signal opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                View discipline &rarr;
              </span>
            </TiltCard>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeIdx !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveIdx(null)}
          >
            <motion.div
              className="glass-panel relative w-full max-w-2xl overflow-hidden rounded-3xl p-10"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveIdx(null)}
                data-cursor="interactive"
                className="absolute right-6 top-6 text-steel transition-colors hover:text-platinum"
              >
                Close
              </button>
              <p className="eyebrow mb-4 text-signal">{services[activeIdx].title}</p>
              <h3 className="font-display mb-6 text-3xl text-platinum sm:text-4xl">
                {services[activeIdx].short}
              </h3>
              <p className="max-w-xl text-balance text-steel">{services[activeIdx].detail}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
