import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const assumptions = [
  'User has a Google account with OAuth permissions granted',
  'Google AI (Gemini API) powers all AI reasoning and context analysis',
  'All data remains in user\'s own Google ecosystem — no external storage',
  'Web-first interface, fully responsive for mobile use',
  'English-only in v1 with multilingual expansion planned',
  'Financial tracking is manual-input only in v1 (no bank API)',
]

const roadmap = [
  { label: 'v1 — Core modules + 10 Google APIs', featured: true },
  { label: 'v2 — Health-only mode / Student mode', featured: false },
  { label: 'v3 — Entrepreneur vertical / Team support', featured: false },
  { label: 'v∞ — Universal life OS', featured: false, glow: true },
]

export default function Scope() {
  return (
    <section id="scope" className="py-32" style={{ background: '#000000' }} aria-labelledby="scope-heading">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 16, letterSpacing: '0.2em' }}
          whileInView={{ opacity: 1, y: 0, letterSpacing: '0.12em' }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="mb-5"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            V1 Scope & Assumptions
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          id="scope-heading"
          className="font-bold mb-16"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1.15 }}
        >
          What's in. What's next.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="glass-card p-8 md:p-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Left: Assumptions */}
            <div>
              <h3
                className="font-semibold text-[15px] text-white mb-6 uppercase tracking-[0.08em]"
                style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              >
                V1 Assumptions
              </h3>
              <div className="flex flex-col gap-4">
                {assumptions.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.07, ease: [0.23, 1, 0.32, 1] }}
                    className="flex items-start gap-3"
                  >
                    <Check size={13} className="text-white/50 mt-[3px] flex-shrink-0" />
                    <span className="text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Roadmap */}
            <div>
              <h3
                className="font-semibold uppercase tracking-[0.08em] mb-6"
                style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              >
                Version Roadmap
              </h3>
              <div className="flex flex-col gap-3">
                {roadmap.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
                  >
                    <div
                      className="px-5 py-3 rounded-full"
                      style={{
                        background: item.featured
                          ? '#ffffff'
                          : 'rgba(255,255,255,0.05)',
                        border: item.featured
                          ? 'none'
                          : item.glow
                          ? '1px solid rgba(255,255,255,0.2)'
                          : '1px solid rgba(255,255,255,0.09)',
                        boxShadow: item.glow ? '0 0 20px rgba(255,255,255,0.08)' : 'none',
                      }}
                    >
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: item.featured ? '#000' : 'rgba(255,255,255,0.6)' }}
                      >
                        {item.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
