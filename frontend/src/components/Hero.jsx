import { motion } from 'framer-motion'
import { ChevronDown, ArrowRight, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const ease = [0.23, 1, 0.32, 1]

const fadeUp = (delay = 0, y = 24) => ({
  initial: { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease },
})

export default function Hero() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden grain-overlay"
      style={{ background: '#000000' }}
      aria-label="Hero section"
    >
      {/* Orbs */}
      <div
        className="orb-1 absolute pointer-events-none"
        aria-hidden="true"
        style={{
          width: 600,
          height: 600,
          bottom: '-10%',
          left: '-10%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)',
          filter: 'blur(80px)',
          borderRadius: '50%',
        }}
      />
      <div
        className="orb-2 absolute pointer-events-none"
        aria-hidden="true"
        style={{
          width: 500,
          height: 500,
          bottom: '-5%',
          right: '-8%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
          borderRadius: '50%',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-[860px] mx-auto">
        {/* Badge */}
        <motion.div {...fadeUp(0.1, 16)}>
          <div className="glass-pill inline-flex items-center gap-2 mb-8">
            <span className="text-[11px] font-medium text-white/40 uppercase tracking-[0.12em]">
              Be yourself; everyone else is already taken
            </span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.2, 24)}
          className="font-black leading-none mb-6"
          style={{
            fontSize: 'clamp(52px, 9vw, 88px)',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
          }}
        >
          <span className="text-white block">Your Life,</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }} className="block">Intelligently Operated.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.35, 16)}
          className="text-[17px] leading-[1.7] max-w-[600px] mb-10"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          LifeSync AI replaces 10+ apps with one intelligent assistant that knows your calendar, emails, tasks, health goals, and finances — then acts on your behalf, before you even ask.
        </motion.p>

        {/* CTAs */}
        <motion.div
           {...fadeUp(0.5, 12)}
           className="flex flex-col sm:flex-row items-center gap-4 mb-10"
         >
           {isAuthenticated ? (
             <button
               className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
               onClick={() => navigate('/dashboard')}
             >
               <Zap size={16} />
               Go to Dashboard
             </button>
           ) : (
             <button
               className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-black"
               onClick={() => navigate('/login')}
             >
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
               Login with Google
             </button>
           )}
           <button
             className="btn-glass w-full sm:w-auto"
             onClick={() => document.querySelector('#modules')?.scrollIntoView({ behavior: 'smooth' })}
           >
             Explore Features
           </button>
         </motion.div>

        {/* Social proof pills */}
        <motion.div {...fadeUp(0.6, 8)} className="flex items-center gap-3 flex-wrap justify-center">
          {['10 Google APIs', 'Proactive AI', 'WCAG 2.1 Compliant'].map((label) => (
            <div key={label} className="glass-pill">
              <span className="text-[12px] text-white/50">{label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div
        className="scroll-arrow absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
        onClick={() => document.querySelector('#problem')?.scrollIntoView({ behavior: 'smooth' })}
        aria-label="Scroll down"
      >
        <span className="text-[11px] text-white/30 uppercase tracking-[0.12em]">Scroll</span>
        <ChevronDown size={18} className="text-white/40" />
      </div>
    </section>
  )
}
