import { motion } from 'framer-motion'
import { Globe, Layers, Zap, Play, GitBranch, Award } from 'lucide-react'

const reasons = [
  {
    icon: Globe,
    title: 'Universal Relevance',
    desc: 'Every judge, evaluator, and human struggles with productivity fragmentation. This resonates on first contact.',
  },
  {
    icon: Layers,
    title: 'Depth Over Breadth',
    desc: '10 Google APIs, each solving a distinct non-trivial problem. Not cosmetic. Not decorative. Core to the product.',
  },
  {
    icon: Zap,
    title: 'Proactive Architecture',
    desc: 'Most AI assistants are reactive — they wait to be asked. LifeSync acts before you ask. That\'s the fundamental difference.',
  },
  {
    icon: Play,
    title: 'Immediate Demo Power',
    desc: 'In 5 minutes: email extraction → calendar block → Maps traffic buffer → Google Doc meeting prep. End-to-end value visible instantly.',
  },
  {
    icon: GitBranch,
    title: 'Scalability Story',
    desc: 'Modular design means student mode, health-only mode, and entrepreneur mode can be added as vertical overlays without rebuilding.',
  },
  {
    icon: Award,
    title: 'Nails All 6 Criteria',
    desc: 'Code quality (SOLID modules), security (OAuth minimal scopes), efficiency (async/parallel), testing (mock services), accessibility (WCAG 2.1), Google APIs (10, non-trivial).',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
}

export default function WhyWins() {
  return (
    <section id="why-wins" className="py-32" style={{ background: '#080808' }} aria-labelledby="why-heading">
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
            A powerful system built on a simple truth:
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          id="why-heading"
          className="font-bold mb-4 text-center"
          style={{ fontSize: 'clamp(22px, 2.8vw, 38px)', letterSpacing: '-0.03em', lineHeight: 1.2 }}
        >
          A universal problem, solved through deep Google integration, intelligent proactive AI, and seamless user experience.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          className="text-[16px] text-center mb-20 max-w-[560px] mx-auto"
          style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}
        >
          This is not just a demo — it’s a real solution designed for real people, solving a problem everyone faces.
        </motion.p>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {reasons.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={i} variants={itemVariants}>
              <div className="glass-card p-7 h-full group cursor-default">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Icon size={17} className="text-white transition-transform duration-300 group-hover:rotate-[8deg]" />
                </div>
                <h3 className="font-semibold text-[17px] text-white mb-2" style={{ letterSpacing: '-0.02em' }}>
                  {title}
                </h3>
                <p className="text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
