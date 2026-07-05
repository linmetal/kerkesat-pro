import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const links = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#projects', label: 'Projects' },
  { href: '#technology', label: 'Technology' },
  { href: '#stats', label: 'Numbers' },
  { href: '#contact', label: 'Contact' },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = () => setOpen(false);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 transition-colors duration-500 sm:px-10 lg:px-20 ${
          scrolled ? 'bg-void/70 backdrop-blur-md' : 'bg-transparent'
        }`}
      >
        <a href="#home" data-cursor="interactive" className="group flex items-center gap-2.5">
          <svg width="24" height="24" viewBox="0 0 34 34" className="transition-transform duration-500 group-hover:rotate-90">
            <polygon points="17,2 30,9.5 30,24.5 17,32 4,24.5 4,9.5" fill="none" stroke="#7fd9ff" strokeWidth="1.3" />
            <polygon points="17,10 24,14 24,22 17,26 10,22 10,14" fill="#7fd9ff" opacity="0.85" />
          </svg>
          <span className="font-display text-sm tracking-tightest text-platinum">ADHAX</span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-cursor="interactive"
              className="text-xs uppercase tracking-widest text-steel transition-colors hover:text-platinum"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <button
          onClick={() => setOpen(true)}
          data-cursor="interactive"
          className="flex flex-col gap-1.5 lg:hidden"
          aria-label="Open menu"
        >
          <span className="h-px w-6 bg-platinum" />
          <span className="h-px w-6 bg-platinum" />
        </button>

        <a
          href="#contact"
          data-cursor="interactive"
          className="hidden text-xs uppercase tracking-widest text-platinum transition-opacity hover:opacity-70 lg:block"
        >
          Start a Project &rarr;
        </a>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-void lg:hidden"
          >
            <button
              onClick={close}
              className="absolute right-6 top-6 text-xs uppercase tracking-widest text-steel"
            >
              Close
            </button>
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                className="font-display text-3xl text-platinum"
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
