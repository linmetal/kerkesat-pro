import { FormEvent, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import MagneticButton from '@/components/shared/MagneticButton';

const projectTypes = ['Architecture', 'Engineering', 'Construction', 'Consulting', 'Urban Development'];

const offices = [
  { city: 'Singapore', status: 'Online' },
  { city: 'Lisbon', status: 'Online' },
  { city: 'Austin', status: 'Online' },
  { city: 'Rotterdam', status: 'Standby' },
];

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', type: projectTypes[0], message: '' });
  const [sent, setSent] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const fieldClass = (field: string) =>
    `w-full bg-transparent border-b py-3 text-platinum outline-none transition-colors duration-300 placeholder:text-steel/60 ${
      focusField === field ? 'border-signal' : 'border-white/15'
    }`;

  return (
    <section id="contact" className="section relative w-full bg-void px-6 py-32 sm:px-10 lg:px-20">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow mb-6">06 — Contact</p>
        <h2 className="font-display mb-16 max-w-2xl text-balance text-4xl leading-tight tracking-tightest text-platinum sm:text-5xl">
          Open a channel to the studio.
        </h2>

        <div className="glass-panel relative grid grid-cols-1 gap-0 overflow-hidden rounded-3xl lg:grid-cols-5">
          <div className="relative col-span-3 p-8 sm:p-12">
            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 gap-8 sm:grid-cols-2"
                >
                  <div className="sm:col-span-1">
                    <label className="eyebrow mb-2 block">Name</label>
                    <input
                      required
                      value={form.name}
                      onChange={handleChange('name')}
                      onFocus={() => setFocusField('name')}
                      onBlur={() => setFocusField(null)}
                      placeholder="Your name"
                      className={fieldClass('name')}
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="eyebrow mb-2 block">Email</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      onFocus={() => setFocusField('email')}
                      onBlur={() => setFocusField(null)}
                      placeholder="you@company.com"
                      className={fieldClass('email')}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="eyebrow mb-2 block">Discipline</label>
                    <select
                      value={form.type}
                      onChange={handleChange('type')}
                      onFocus={() => setFocusField('type')}
                      onBlur={() => setFocusField(null)}
                      className={`${fieldClass('type')} appearance-none`}
                    >
                      {projectTypes.map((t) => (
                        <option key={t} value={t} className="bg-ink">
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="eyebrow mb-2 block">Project Brief</label>
                    <textarea
                      required
                      rows={4}
                      value={form.message}
                      onChange={handleChange('message')}
                      onFocus={() => setFocusField('message')}
                      onBlur={() => setFocusField(null)}
                      placeholder="Tell us what you're building"
                      className={`${fieldClass('message')} resize-none`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <MagneticButton variant="primary" className="w-full sm:w-auto">
                      Transmit
                    </MagneticButton>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full min-h-[320px] flex-col items-center justify-center text-center"
                >
                  <span className="mb-6 h-14 w-14 animate-pulse rounded-full border border-signal/60 shadow-[0_0_40px_rgba(127,217,255,0.4)]" />
                  <h3 className="font-display text-2xl text-platinum">Transmission received.</h3>
                  <p className="mt-2 max-w-xs text-steel">
                    A member of the studio will respond within one business day.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative col-span-2 border-t border-white/10 bg-black/20 p-8 sm:p-12 lg:border-l lg:border-t-0">
            <p className="eyebrow mb-6">Studio Status</p>
            <ul className="space-y-4">
              {offices.map((o) => (
                <li key={o.city} className="flex items-center justify-between text-sm">
                  <span className="text-mist">{o.city}</span>
                  <span className="flex items-center gap-2 text-steel">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        o.status === 'Online' ? 'bg-signal shadow-[0_0_8px_rgba(127,217,255,0.9)]' : 'bg-steel'
                      }`}
                    />
                    {o.status}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-10 border-t border-white/10 pt-6 text-sm text-steel">
              <p>hello@adhax.enterprise</p>
              <p className="mt-1">+1 (555) 019-2044</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
