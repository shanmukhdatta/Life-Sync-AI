import { motion } from 'framer-motion'
import {
  LayoutDashboard, Mail, Calendar, Target, MessageSquare,
  FileText, TrendingUp, PenTool, MapPin, BarChart2
} from 'lucide-react'

const modules = [
  {
    num: '01', icon: LayoutDashboard, title: 'Unified Smart Dashboard',
    desc: 'Morning briefing at 8 AM with top 3 priorities, AI-generated priority scores, and context-switching alerts.',
    features: ['Morning Briefing', 'AI Priority Score', 'Context Alerts'],
    large: true,
  },
  {
    num: '02', icon: Mail, title: 'Proactive Email Intelligence',
    desc: 'Action item extraction, smart reply drafts, Inbox Zero assistant, and Email-to-Calendar bridge.',
    features: ['Action Extractor', 'Smart Drafts', 'Inbox Zero'],
    large: true,
  },
  {
    num: '03', icon: Calendar, title: 'Intelligent Calendar Co-Pilot',
    desc: 'Conflict detection, smart meeting preparation 30 min before, and focus time protection.',
    large: false,
  },
  {
    num: '04', icon: Target, title: 'Life Goals & Habit Tracker',
    desc: 'Adaptive habit scheduling with Google Fit sync, streaks with context, and weekly life score.',
    large: false,
  },
  {
    num: '05', icon: MessageSquare, title: 'Conversational Task Engine',
    desc: 'Natural language commands, multi-step task chaining, decision support mode, and memory.',
    large: false,
  },
  {
    num: '06', icon: FileText, title: 'Document Intelligence Hub',
    desc: 'Pre-meeting doc surfacing, smart summarization, and cross-doc natural language search.',
    large: false,
  },
  {
    num: '07', icon: TrendingUp, title: 'Financial Pulse Tracker',
    desc: 'One-tap expense logging, smart budget alerts, and monthly insight reports.',
    large: false,
  },
  {
    num: '08', icon: PenTool, title: 'Smart Communication Composer',
    desc: 'Tone-aware drafting, follow-up sequencer, and meeting notes auto-generation.',
    large: false,
  },
  {
    num: '09', icon: MapPin, title: 'Location-Aware Context Engine',
    desc: 'Smart travel buffers, errand batching, and location-triggered reminders.',
    large: false,
  },
  {
    num: '10', icon: BarChart2, title: 'AI-Powered Weekly Life Review',
    desc: 'Automated last-week summary, next-week pre-load, and goal progress check.',
    large: false,
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
}

export default function Modules() {
  return (
    <section id="modules" className="py-32" style={{ background: '#000000' }} aria-labelledby="modules-heading">
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
            10 Intelligent Modules
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          id="modules-heading"
          className="font-bold mb-16"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1.15 }}
        >
          Everything you need to run your life — in one system.
        </motion.h2>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Large cards span 2 cols */}
          {modules.map((mod, i) => {
            const Icon = mod.icon
            const isLarge = mod.large
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                className={isLarge ? 'md:col-span-2' : 'col-span-1'}
              >
                <div
                  className={`glass-card group cursor-default h-full ${isLarge ? 'p-8' : 'p-6'}`}
                  style={{ minHeight: isLarge ? 220 : 180 }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: 'rgba(255,255,255,0.25)' }}
                    >
                      {mod.num}
                    </span>
                    <Icon
                      size={isLarge ? 22 : 18}
                      className="text-white transition-transform duration-300 group-hover:rotate-[5deg]"
                    />
                  </div>

                  {/* Title */}
                  <h3
                    className="font-semibold text-white mb-2"
                    style={{
                      fontSize: isLarge ? '20px' : '16px',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.3,
                    }}
                  >
                    {mod.title}
                  </h3>

                  {/* Desc */}
                  <p
                    className="text-[13px] leading-[1.65] mb-4"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {mod.desc}
                  </p>

                  {/* Feature pills for large cards */}
                  {isLarge && mod.features && (
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {mod.features.map((f) => (
                        <span key={f} className="glass-pill text-[11px] text-white/40">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
