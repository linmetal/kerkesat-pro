import { useEffect, useRef, useState } from 'react';

// Numbers that count to their new value — the whole panel should feel alive.
export function Num({ value, format, className }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  const raf = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    const b = value;
    if (a === b) return undefined;
    const step = (now) => {
      const p = Math.min(1, (now - start) / 650);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(a + (b - a) * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
      else from.current = b;
    };
    raf.current = requestAnimationFrame(step);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [value]);

  return <span className={className}>{format ? format(shown) : Math.round(shown)}</span>;
}

// Net worth over every quarter played, including the negative stretches.
export function Spark({ data, color = '#38e08a' }) {
  const w = 260;
  const h = 54;
  if (!data || data.length < 2) return <svg width="100%" viewBox={`0 0 ${w} ${h}`} />;
  const pts = data.slice(-80);
  const min = Math.min(...pts, 0);
  const max = Math.max(...pts, 1);
  const span = max - min || 1;
  const x = (i) => (i / (pts.length - 1)) * w;
  const y = (v) => h - ((v - min) / span) * (h - 6) - 3;
  const line = pts.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const zero = min < 0 ? y(0) : null;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="spark">
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {zero !== null && <line x1="0" y1={zero} x2={w} y2={zero} stroke="#2a3440" strokeDasharray="2 3" />}
      <polygon points={`0,${h} ${line} ${w},${h}`} fill="url(#sparkfill)" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" />
      <circle cx={x(pts.length - 1)} cy={y(pts[pts.length - 1])} r="2.6" fill={color} />
    </svg>
  );
}

// 0-100 meters: reputation, morale, influence, stress.
export function Meter({ label, value, invert }) {
  const v = Math.max(0, Math.min(100, value));
  const good = invert ? v < 45 : v > 55;
  const bad = invert ? v > 75 : v < 25;
  const color = bad ? '#ff4d4d' : good ? '#38e08a' : '#f0b429';
  return (
    <div className="meter">
      <div className="meter-top">
        <span>{label}</span>
        <span style={{ color }}>{Math.round(v)}</span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${v}%`, background: color }} />
      </div>
      <style jsx>{`
        .meter { margin-bottom: 10px; }
        .meter-top {
          display: flex; justify-content: space-between;
          font-size: 10px; letter-spacing: 0.08em; color: #6b7a8b; margin-bottom: 4px;
        }
        .meter-track { height: 4px; background: #131b24; overflow: hidden; }
        .meter-fill { height: 100%; transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1); }
      `}</style>
    </div>
  );
}

export function Delta({ value, format }) {
  if (!value || Math.abs(value) < 0.5) return null;
  const up = value > 0;
  return (
    <span className={up ? 'delta up' : 'delta down'}>
      {up ? '▲' : '▼'} {format ? format(Math.abs(value)) : Math.round(Math.abs(value))}
      <style jsx>{`
        .delta { font-size: 10px; margin-left: 6px; }
        .up { color: #38e08a; }
        .down { color: #ff6b6b; }
      `}</style>
    </span>
  );
}
