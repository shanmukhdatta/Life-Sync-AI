import { motion } from 'framer-motion'
import { Calendar, Mail, Activity, Shuffle, Eye } from 'lucide-react'
import { useCountUp } from '../hooks/useCountUp'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
}

function StatCard({ value, suffix, label }) {
  const { ref, displayValue } = useCountUp(value, 1800, suffix)
  return (
    <div ref={ref} className="glass-card p-8 flex flex-col items-center text-center">
      <span
        className="stat-number font-black mb-3"
        style={{ fontSize: 'clamp(48px, 6vw, 72px)', letterSpacing: '-0.04em', color: '#fff' }}
      >
        {displayValue}
      </span>
      <p className="text-[15px] leading-[1.6]" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
    </div>
  )
}

const painPoints = [
  { icon: Calendar, title: 'Missed Deadlines', desc: 'A calendar conflict buried in email that nobody connected the dots on.' },
  { icon: Mail, title: 'Forgotten Follow-Ups', desc: 'Important threads buried in inboxes with no intelligent surfacing.' },
  { icon: Activity, title: 'Abandoned Health Goals', desc: 'No system fits wellness goals into your actual schedule intelligently.' },
  { icon: Shuffle, title: 'Constant Context-Switching', desc: '9 apps, 9 different mental models, all day — every single day.' },
  { icon: Eye, title: 'No Single Source of Truth', desc: 'Zero visibility into what actually matters most today.' },
]

export default function Problem() {
  return (
    <section id="problem" className="py-32" style={{ background: '#000000' }} aria-labelledby="problem-heading">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 16, letterSpacing: '0.2em' }}
          whileInView={{ opacity: 1, y: 0, letterSpacing: '0.12em' }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="mb-16"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            The Problem
          </span>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
        >
          {[
            { value: 9, suffix: '+', label: 'Productivity apps the average professional uses daily' },
            { value: 28, suffix: '%', label: 'Of the workday lost to managing email alone' },
            { value: 20, suffix: '%', label: 'Lost just searching for information across tools' },
          ].map((stat, i) => (
            <motion.div key={i} variants={itemVariants}>
              <StatCard {...stat} />
            </motion.div>
          ))}
        </motion.div>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          id="problem-heading"
          className="font-bold mb-16 max-w-[700px]"
          style={{ fontSize: 'clamp(32px, 4vw, 52px)', letterSpacing: '-0.03em', lineHeight: 1.1 }}
        >
          Modern life is scattered across too many disconnected tools.
        </motion.h2>

        {/* Pain points */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {painPoints.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={i} variants={itemVariants}>
              <div className="glass-card p-7 h-full group cursor-default">
                <div className="mb-4">
                  <Icon size={20} className="text-white transition-transform duration-300 group-hover:rotate-[8deg]" />
                </div>
                <h3 className="font-semibold text-[17px] text-white mb-2" style={{ letterSpacing: '-0.02em' }}>{title}</h3>
                <p className="text-[14px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.5)' }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
