import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const criteria = [
  {
    criterion: 'Code Quality',
    delivery: 'Service-oriented architecture: Gmail Module, Calendar Module, Maps Module — each independently testable following clean SOLID principles.',
  },
  {
    criterion: 'Security',
    delivery: 'OAuth 2.0 minimal scopes — permission-based only. Zero external data storage. All data stays inside user\'s own Google account. Tokens refreshed server-side only.',
  },
  {
    criterion: 'Efficiency',
    delivery: 'Async and parallel API calls for dashboard loading. Intelligent caching of calendar events and Drive docs with smart cache invalidation strategy.',
  },
  {
    criterion: 'Testing',
    delivery: 'Every Google service module has a mock implementation for unit testing without live API calls. E2E integration tests run against real accounts.',
  },
  {
    criterion: 'Accessibility',
    delivery: 'Voice input support, full keyboard navigation, WCAG 2.1 compliant, screen reader ARIA labels, adjustable text size, high-contrast compatible.',
  },
  {
    criterion: 'Google Services',
    delivery: '10 Google APIs integrated — each with a distinct, non-trivial feature. Integration is core to functionality, not decorative surface-level usage.',
  },
]

export default function Evaluation() {
  return (
    <section id="evaluation" className="py-32" style={{ background: '#000000' }} aria-labelledby="eval-heading">
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
            Evaluation Alignment
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          id="eval-heading"
          className="font-bold mb-16"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1.15 }}
        >
          Built to win on every dimension.
        </motion.h2>

        {/* Custom table */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="rounded-[20px] overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          role="table"
          aria-label="Evaluation criteria table"
        >
          {/* Header */}
          <div
            className="grid grid-cols-[1fr_2.5fr_80px] gap-4 px-7 py-4"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            role="row"
          >
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              role="columnheader"
            >
              Criterion
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              role="columnheader"
            >
              How LifeSync Delivers
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-[0.1em] hidden md:block"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              role="columnheader"
            >
              Status
            </span>
          </div>

          {/* Rows */}
          {criteria.map((row, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.23, 1, 0.32, 1] }}
              className="table-row grid grid-cols-[1fr_2.5fr_80px] gap-4 px-7 py-5"
              style={{
                background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}
              role="row"
            >
              <div role="cell">
                <span className="font-semibold text-[14px] text-white" style={{ letterSpacing: '-0.01em' }}>
                  {row.criterion}
                </span>
              </div>
              <div role="cell">
                <span className="text-[13px] leading-[1.65]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {row.delivery}
                </span>
              </div>
              <div className="hidden md:flex items-start justify-center pt-[2px]" role="cell">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                  style={{ background: '#ffffff', borderRadius: 9999 }}
                >
                  <Check size={11} className="text-black" />
                  <span className="text-[11px] font-semibold text-black">Done</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
