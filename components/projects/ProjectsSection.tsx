import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TiltCard from '@/components/shared/TiltCard';
import ProjectSkyline from './ProjectSkyline';

type Project = {
  title: string;
  location: string;
  year: string;
  category: string;
  seed: number;
  accent: string;
  summary: string;
};

const projects: Project[] = [
  { title: 'Meridian Tower', location: 'Singapore', year: '2023', category: 'Mixed-Use', seed: 12, accent: '#7fd9ff', summary: 'A 62-story vertical district with a bioclimatic facade that cuts solar gain by 40%.' },
  { title: 'Obsidian Transit Hub', location: 'Doha', year: '2022', category: 'Infrastructure', seed: 27, accent: '#ff6a3d', summary: 'An underground transit concourse lit entirely by engineered daylight shafts.' },
  { title: 'Vantage Residences', location: 'Lisbon', year: '2024', category: 'Residential', seed: 41, accent: '#7fd9ff', summary: 'Terraced coastal residences designed around passive cross-ventilation.' },
  { title: 'Helios Campus', location: 'Austin', year: '2021', category: 'Corporate', seed: 8, accent: '#c9ccd2', summary: 'A net-positive-energy campus generating 108% of its own annual demand.' },
  { title: 'Northbank Pavilion', location: 'Rotterdam', year: '2023', category: 'Cultural', seed: 33, accent: '#ff6a3d', summary: 'A cantilevered cultural pavilion suspended above a restored tidal wetland.' },
  { title: 'Aurora District', location: 'Reykjavik', year: '2025', category: 'Urban Planning', seed: 19, accent: '#7fd9ff', summary: 'A geothermal-powered district masterplan for 14,000 residents.' },
];

export default function ProjectsSection() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [slider, setSlider] = useState(50);

  const active = activeIdx !== null ? projects[activeIdx] : null;

  return (
    <section id="projects" className="section relative w-full bg-ink px-6 py-32 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow mb-6">03 — Projects</p>
        <h2 className="font-display mb-16 max-w-2xl text-balance text-4xl leading-tight tracking-tightest text-platinum sm:text-5xl">
          A portfolio built to outlast trend.
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <TiltCard
              key={p.title}
              max={6}
              onClick={() => {
                setActiveIdx(i);
                setSlider(50);
              }}
              className="glass-panel group relative flex h-80 cursor-pointer flex-col justify-end overflow-hidden rounded-2xl p-6"
            >
              <div className="absolute inset-0 opacity-70 transition-transform duration-500 group-hover:scale-105">
                <ProjectSkyline seed={p.seed} mode="solid" accent={p.accent} />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              <div className="relative z-10">
                <span className="eyebrow text-signal">{p.category}</span>
                <h3 className="font-display mt-2 text-2xl text-platinum">{p.title}</h3>
                <p className="mt-1 text-sm text-steel">
                  {p.location} &middot; {p.year}
                </p>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveIdx(null)}
          >
            <motion.div
              className="glass-panel relative w-full max-w-3xl overflow-hidden rounded-3xl"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setActiveIdx(null)}
                data-cursor="interactive"
                className="absolute right-6 top-6 z-20 text-steel transition-colors hover:text-platinum"
              >
                Close
              </button>

              <div className="relative h-72 w-full overflow-hidden bg-void">
                <div className="absolute inset-0">
                  <ProjectSkyline seed={active.seed} mode="solid" accent={active.accent} />
                </div>
                <div
                  className="absolute inset-0 bg-void"
                  style={{ clipPath: `inset(0 0 0 ${slider}%)` }}
                >
                  <ProjectSkyline seed={active.seed} mode="wireframe" accent={active.accent} />
                </div>
                <div
                  className="pointer-events-none absolute inset-y-0 w-px bg-platinum/70"
                  style={{ left: `${slider}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={slider}
                  onChange={(e) => setSlider(Number(e.target.value))}
                  data-cursor="interactive"
                  className="absolute inset-x-0 bottom-4 mx-auto w-2/3 accent-signal"
                  aria-label="Before and after reveal"
                />
                <span className="absolute bottom-10 left-6 text-xs uppercase tracking-widest text-steel">
                  Blueprint
                </span>
                <span className="absolute bottom-10 right-6 text-xs uppercase tracking-widest text-steel">
                  Delivered
                </span>
              </div>

              <div className="p-10">
                <span className="eyebrow text-signal">{active.category}</span>
                <h3 className="font-display mt-2 text-3xl text-platinum sm:text-4xl">{active.title}</h3>
                <p className="mt-1 text-sm text-steel">
                  {active.location} &middot; {active.year}
                </p>
                <p className="mt-6 max-w-xl text-balance text-steel">{active.summary}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
