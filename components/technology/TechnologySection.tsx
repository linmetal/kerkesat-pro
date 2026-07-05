import { useState } from 'react';

type Node = {
  id: string;
  label: string;
  detail: string;
  angle: number;
};

const nodes: Node[] = [
  { id: 'bim', label: 'BIM Modeling', detail: 'Every discipline coordinated in a single federated 3D model.', angle: -90 },
  { id: 'twin', label: 'Digital Twin Simulation', detail: 'Live sensor data mirrored onto a physics-accurate virtual replica.', angle: -45 },
  { id: 'ai', label: 'Generative Design AI', detail: 'Thousands of structural options evaluated before lunch.', angle: 0 },
  { id: 'drone', label: 'Drone Surveying', detail: 'Millimeter-accurate site data captured autonomously, weekly.', angle: 45 },
  { id: 'iot', label: 'IoT Sensor Networks', detail: 'Structural health monitored in real time, forever.', angle: 90 },
  { id: 'robot', label: 'Robotic Fabrication', detail: 'CNC and robotic arms translate the model directly into material.', angle: 135 },
  { id: 'cloud', label: 'Cloud Collaboration', detail: 'One live source of truth across every office, every timezone.', angle: 180 },
  { id: 'predictive', label: 'Predictive Analytics', detail: 'Machine learning flags structural risk years before it emerges.', angle: 225 },
];

const RADIUS = 40;

function polar(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180;
  return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
}

export default function TechnologySection() {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = nodes.find((n) => n.id === hovered) ?? null;

  return (
    <section
      id="technology"
      className="section relative w-full overflow-hidden bg-void px-6 py-32 sm:px-10 lg:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <p className="eyebrow mb-6">04 — Technology</p>
        <h2 className="font-display mb-6 max-w-2xl text-balance text-4xl leading-tight tracking-tightest text-platinum sm:text-5xl">
          A studio operating system, not a stack of tools.
        </h2>
        <p className="mb-16 max-w-xl text-steel">
          Every system ADHAX runs on is connected to the same live model —
          hover a node to see what it powers.
        </p>

        <div className="relative mx-auto aspect-square w-full max-w-2xl">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
            <defs>
              <radialGradient id="core-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#7fd9ff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7fd9ff" stopOpacity="0" />
              </radialGradient>
            </defs>

            {nodes.map((n) => {
              const p = polar(n.angle, RADIUS);
              const isActive = hovered === n.id;
              return (
                <g key={n.id}>
                  <line
                    x1="50"
                    y1="50"
                    x2={p.x}
                    y2={p.y}
                    stroke={isActive ? '#7fd9ff' : '#2a2b30'}
                    strokeWidth={isActive ? 0.4 : 0.25}
                    style={{ transition: 'stroke 0.3s ease' }}
                  />
                  <circle r="0.9" fill="#7fd9ff" opacity={isActive ? 1 : 0.55}>
                    <animateMotion
                      dur={`${3 + (n.angle % 5)}s`}
                      repeatCount="indefinite"
                      path={`M 50 50 L ${p.x} ${p.y}`}
                    />
                  </circle>
                </g>
              );
            })}

            <circle cx="50" cy="50" r="14" fill="url(#core-glow)" />
            <circle cx="50" cy="50" r="4.5" fill="#0a0a0c" stroke="#7fd9ff" strokeWidth="0.4" />
          </svg>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="font-display text-xs uppercase tracking-widest text-signal">ADHAX</span>
            <br />
            <span className="font-display text-xs uppercase tracking-widest text-steel">Core</span>
          </div>

          {nodes.map((n) => {
            const p = polar(n.angle, RADIUS);
            return (
              <button
                key={n.id}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered(null)}
                data-cursor="interactive"
                className="glass-panel absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full px-3 py-2 text-center text-[10px] font-medium leading-tight text-mist transition-all duration-300 hover:scale-110 hover:text-platinum sm:text-xs"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  borderColor: hovered === n.id ? 'rgba(127,217,255,0.6)' : undefined,
                  boxShadow: hovered === n.id ? '0 0 30px rgba(127,217,255,0.25)' : undefined,
                  maxWidth: '9rem',
                }}
              >
                {n.label}
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-12 h-16 max-w-xl text-center">
          {active && (
            <p className="text-balance text-steel">
              <span className="text-signal">{active.label}</span> — {active.detail}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
