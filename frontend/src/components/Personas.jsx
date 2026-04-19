import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { GraduationCap, Briefcase, Rocket, Check } from 'lucide-react'

const personas = [
  {
    initials: 'CS',
    icon: GraduationCap,
    title: 'The College Student',
    role: 'Student · Hackathon Participant',
    pain: 'Assignments, club meetings, hackathon deadlines, internship applications — all scattered.',
    bullets: [
      'Extracts deadlines from professor emails automatically',
      'Blocks study time based on course load',
      'Alerts 2 days before each deadline',
      'Tracks internship application follow-ups',
    ],
    featured: false,
  },
  {
    initials: 'WP',
    icon: Briefcase,
    title: 'The Working Professional',
    role: 'Full-Time · 40+ hrs/week',
    pain: 'Back-to-back meetings, overflowing inbox, forgotten follow-ups, missed gym sessions.',
    bullets: [
      'Drafts pre-meeting briefs 30 minutes before',
      'Chains multi-step workflows in one command',
      'Blocks lunch and gym time proactively',
      'Generates comprehensive end-of-day summary',
    ],
    featured: true,
  },
  {
    initials: 'EF',
    icon: Rocket,
    title: 'The Entrepreneur / Freelancer',
    role: 'Independent · Multiple Clients',
    pain: 'Clients, invoices, proposals, and personal projects with no integrated system.',
    bullets: [
      'Tracks client follow-up sequences automatically',
      'Alerts on overdue invoices parsed from Gmail',
      'Auto-organizes Drive by client project',
      'Generates weekly business pulse in Sheets',
    ],
    featured: false,
  },
]

function PersonaCard({ persona }) {
  const cardRef = useRef(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const springX = useSpring(rotateX, { stiffness: 150, damping: 20 })
  const springY = useSpring(rotateY, { stiffness: 150, damping: 20 })

  const handleMouseMove = (e) => {
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY
    rotateX.set(-(mouseY / (rect.height / 2)) * 8)
    rotateY.set((mouseX / (rect.width / 2)) * 8)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  const { icon: Icon } = persona

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springX,
        rotateY: springY,
        perspective: 1000,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
    >
      <div
        className="glass-card p-8 h-full flex flex-col cursor-default"
        style={{
          borderColor: persona.featured ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
          paddingTop: persona.featured ? 40 : 32,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {persona.featured && (
          <div
            className="absolute top-0 left-0 right-0 h-[1px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }}
          />
        )}

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[15px]"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              letterSpacing: '-0.01em',
            }}
          >
            {persona.initials}
          </div>
          <div>
            <h3 className="font-semibold text-[17px] text-white" style={{ letterSpacing: '-0.02em' }}>
              {persona.title}
            </h3>
            <div
              className="glass-pill mt-1 inline-block"
              style={{ padding: '3px 10px' }}
            >
              <span className="text-[11px] text-white/40">{persona.role}</span>
            </div>
          </div>
        </div>

        {/* Pain */}
        <p className="text-[14px] leading-[1.65] mb-6 italic" style={{ color: 'rgba(255,255,255,0.45)' }}>
          "{persona.pain}"
        </p>

        {/* Bullets */}
        <div className="flex flex-col gap-3 mt-auto">
          {persona.bullets.map((bullet, i) => (
            <div key={i} className="flex items-start gap-3">
              <Check size={13} className="text-white/40 mt-[3px] flex-shrink-0" />
              <span className="text-[13px] leading-[1.5]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {bullet}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function Personas() {
  return (
    <section id="personas" className="py-32" style={{ background: '#000000' }} aria-labelledby="personas-heading">
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
            Who It's Built For
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          id="personas-heading"
          className="font-bold mb-16"
          style={{ fontSize: 'clamp(28px, 3.5vw, 48px)', letterSpacing: '-0.03em', lineHeight: 1.15 }}
        >
          One system. Three types of people. Infinite use cases.
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {personas.map((persona, i) => (
            <PersonaCard key={i} persona={persona} />
          ))}
        </div>
      </div>
    </section>
  )
}
