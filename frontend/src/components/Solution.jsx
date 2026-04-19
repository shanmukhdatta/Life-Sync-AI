import { motion } from 'framer-motion'
import { BrainCircuit, Zap, Sparkles } from 'lucide-react'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
}
const itemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
}

const pillars = [
  {
    icon: BrainCircuit,
    title: 'Understands Full Context',
    desc: 'Reads your calendar, emails, tasks, habits, and location simultaneously to build a complete picture of your life.',
  },
  {
    icon: Zap,
    title: 'Acts Without Being Asked',
    desc: 'Proactively surfaces relevant documents, drafts replies, blocks focus time, and chains multi-step workflows — before you think to ask.',
  },
  {
    icon: Sparkles,
    title: 'Learns And Improves',
    desc: 'Adapts to your preferred meeting lengths, communication tone, productivity patterns, and recurring task sequences over time.',
  },
]

export default function Solution() {
  return (
    <section id="solution" className="py-32" style={{ background: '#080808' }} aria-labelledby="solution-heading">
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
            The Solution
          </span>
        </motion.div>

        {/* Blockquote */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-[700px] mx-auto mb-24 flex gap-6"
        >
          <div
            className="flex-shrink-0 w-[2px] rounded-full"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          />
          <blockquote
            className="font-light italic leading-[1.6]"
            style={{ fontSize: 'clamp(20px, 2.5vw, 30px)', color: '#fff', margin: 0 }}
          >
            "Most people juggle 10+ apps just to manage their day. LifeSync AI replaces all of them with one intelligent assistant that knows your calendar, emails, tasks, health goals, finances, and daily habits — then proactively makes decisions and takes actions on your behalf, exactly when you need it."
          </blockquote>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="text-center text-[13px] font-semibold uppercase tracking-[0.12em] mb-20"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          "Not just an assistant. A life operating system."
        </motion.p>

        {/* Three pillars */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {pillars.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={i} variants={itemVariants}>
              <div className="glass-card p-8 h-full group cursor-default">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <Icon size={18} className="text-white transition-transform duration-300 group-hover:rotate-[8deg]" />
                </div>
                <h3
                  id="solution-heading"
                  className="font-semibold text-[19px] text-white mb-3"
                  style={{ letterSpacing: '-0.02em' }}
                >
                  {title}
                </h3>
                <p className="text-[15px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.55)' }}>
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
