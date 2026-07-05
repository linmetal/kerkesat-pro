import { useRef, MouseEvent, ReactNode } from 'react';

type MagneticButtonProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary';
};

export default function MagneticButton({
  children,
  className = '',
  onClick,
  href,
  variant = 'primary',
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate3d(${x * 0.32}px, ${y * 0.32}px, 0)`;
    const label = el.querySelector('[data-label]') as HTMLElement | null;
    if (label) label.style.transform = `translate3d(${x * 0.15}px, ${y * 0.15}px, 0)`;
  };

  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate3d(0,0,0)';
    const label = el.querySelector('[data-label]') as HTMLElement | null;
    if (label) label.style.transform = 'translate3d(0,0,0)';
  };

  const base =
    variant === 'primary'
      ? 'bg-platinum text-void hover:shadow-[0_0_40px_rgba(232,233,236,0.25)]'
      : 'bg-transparent text-platinum border border-white/20 hover:border-white/50';

  const Comp: any = href ? 'a' : 'button';

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="magnetic-btn inline-block transition-transform duration-200 ease-out"
      data-cursor="interactive"
    >
      <Comp
        href={href}
        onClick={onClick}
        className={`relative inline-flex items-center justify-center px-8 py-4 rounded-full text-sm font-medium tracking-wide transition-shadow duration-300 ${base} ${className}`}
      >
        <span data-label className="transition-transform duration-200 ease-out inline-block">
          {children}
        </span>
      </Comp>
    </div>
  );
}
