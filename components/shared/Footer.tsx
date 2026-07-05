export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full overflow-hidden border-t border-white/10 bg-void px-6 py-14 sm:px-10 lg:px-20">
      <div className="pointer-events-none absolute inset-0">
        {new Array(18).fill(0).map((_, i) => (
          <span
            key={i}
            className="animate-drift absolute rounded-full bg-signal/40"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 6) * 0.9}s`,
              animationDuration: `${6 + (i % 5)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 sm:flex-row">
        <div className="flex items-center gap-3">
          <svg width="34" height="34" viewBox="0 0 34 34" className="animate-drift">
            <polygon
              points="17,2 30,9.5 30,24.5 17,32 4,24.5 4,9.5"
              fill="none"
              stroke="#7fd9ff"
              strokeWidth="1"
            />
            <polygon points="17,10 24,14 24,22 17,26 10,22 10,14" fill="#7fd9ff" opacity="0.85" />
          </svg>
          <span className="font-display tracking-tightest text-platinum">ADHAX ENTERPRISE</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-widest text-steel">
          <a href="#about" className="transition-colors hover:text-platinum">About</a>
          <a href="#services" className="transition-colors hover:text-platinum">Services</a>
          <a href="#projects" className="transition-colors hover:text-platinum">Projects</a>
          <a href="#technology" className="transition-colors hover:text-platinum">Technology</a>
          <a href="#contact" className="transition-colors hover:text-platinum">Contact</a>
        </nav>

        <p className="text-xs text-steel">&copy; {year} ADHAX Enterprise. All rights reserved.</p>
      </div>
    </footer>
  );
}
