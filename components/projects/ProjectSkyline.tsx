function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export default function ProjectSkyline({
  seed,
  mode,
  accent,
}: {
  seed: number;
  mode: 'wireframe' | 'solid';
  accent: string;
}) {
  const rand = seededRandom(seed);
  const bars = new Array(9).fill(0).map((_, i) => {
    const h = 18 + rand() * 78;
    const w = 6 + rand() * 5;
    return { h, w, x: i * 11 + rand() * 2 };
  });

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" className="h-full w-full">
      <defs>
        <linearGradient id={`grad-${seed}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
        </linearGradient>
      </defs>
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={100 - b.h}
          width={b.w}
          height={b.h}
          fill={mode === 'solid' ? `url(#grad-${seed})` : 'none'}
          stroke={accent}
          strokeWidth={mode === 'wireframe' ? 0.4 : 0}
          opacity={mode === 'wireframe' ? 0.8 : 1}
        />
      ))}
    </svg>
  );
}
