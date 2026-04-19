import { motion } from 'framer-motion'
import { Mail, Calendar, FileText, MapPin, Activity, BarChart2, ClipboardList, BookOpen, CheckSquare, Cpu } from 'lucide-react'

const apis = [
  { name: 'Gmail API', icon: Mail, feature: 'Email parsing, action extraction, smart replies, bill detection' },
  { name: 'Google Calendar', icon: Calendar, feature: 'Event creation, conflict detection, focus time blocking' },
  { name: 'Google Drive', icon: FileText, feature: 'Pre-meeting doc surfacing, smart search, auto-organization' },
  { name: 'Google Maps', icon: MapPin, feature: 'Real-time traffic buffers, errand batching, location reminders' },
  { name: 'Google Fit', icon: Activity, feature: 'Activity sync, sleep patterns, workout rescheduling' },
  { name: 'Google Sheets', icon: BarChart2, feature: 'Weekly life score, financial tracking, expense reports' },
  { name: 'Google Forms', icon: ClipboardList, feature: 'Expense logging, habit check-ins, feedback collection' },
  { name: 'Google Docs', icon: BookOpen, feature: 'Meeting notes, weekly plans, communication drafts' },
  { name: 'Google Tasks', icon: CheckSquare, feature: 'Task creation from emails, priority scoring, deadlines' },
  { name: 'Gemini AI', icon: Cpu, feature: 'Core LLM, context analysis, decision support, tone detection' },
]

const pipelineNodes = ['Gmail', 'Gemini AI', 'Calendar', 'Dashboard']

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } }
}

export default function Integrations() {
  return (
    <section id="integrations" className="py-32" style={{ background: '#080808' }} aria-labelledby="integrations-heading">
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
            Powered by Google AI
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          id="integrations-heading"
          className="font-bold mb-4"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1.15 }}
        >
          10 Google APIs. All meaningfully integrated.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="text-[16px] mb-16 max-w-[560px]"
          style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}
        >
          Not cosmetic integrations. Each API powers a distinct, non-trivial feature that would not exist without it.
        </motion.p>

        {/* API Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-20"
        >
          {apis.map((api, i) => {
            const Icon = api.icon
            return (
              <motion.div key={i} variants={itemVariants} className="group relative">
                <div className="glass-card p-5 text-center cursor-default h-full flex flex-col items-center gap-3">
                  <Icon size={20} className="text-white/70 group-hover:text-white transition-colors" />
                  <span className="text-[12px] font-medium text-white/60 group-hover:text-white/80 transition-colors text-center leading-tight">
                    {api.name}
                  </span>
                </div>
                {/* Tooltip */}
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20"
                >
                  <div
                    className="rounded-xl p-3 text-[11px] text-white/70 text-center"
                    style={{
                      background: 'rgba(0,0,0,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {api.feature}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Pipeline flow */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Data Pipeline
          </p>
          <div className="flex items-center justify-center flex-wrap gap-3">
            {pipelineNodes.map((node, i) => (
              <div key={node} className="flex items-center gap-3">
                <div className="glass-pill">
                  <span className="text-[13px] font-medium text-white/70">{node}</span>
                </div>
                {i < pipelineNodes.length - 1 && (
                  <div className="flex items-center gap-1">
                    <div className="w-8 h-[1px]" style={{ background: 'rgba(255,255,255,0.2)' }} />
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.5)',
                        animation: `pulseDot ${1.5 + i * 0.4}s ease-in-out infinite`,
                        animationDelay: `${i * 0.3}s`,
                      }}
                    />
                    <div className="w-8 h-[1px]" style={{ background: 'rgba(255,255,255,0.2)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
