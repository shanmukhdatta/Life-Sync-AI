import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const RING_COUNT = 6

export default function Footer() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()

  return (
    <section
      id="footer"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: '#000000' }}
      aria-label="Footer closing section"
    >
      {/* Concentric rings */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        {Array.from({ length: RING_COUNT }).map((_, i) => (
          <div
            key={i}
            className="ring absolute rounded-full"
            style={{
              width: `${180 + i * 100}px`,
              height: `${180 + i * 100}px`,
              animationDelay: `${i * 0.6}s`,
              animationDuration: '4s',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="font-black leading-none mb-6"
          style={{
            fontSize: 'clamp(40px, 7vw, 72px)',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
          }}
        >
          <span className="text-white block">Not just an assistant.</span>
          <span className="block" style={{ color: 'rgba(255,255,255,0.85)' }}>A life operating system.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          className="text-[13px] font-medium uppercase tracking-[0.12em] mb-12"
          style={{ color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em' }}
        >
          LifeSync AI · Powered by Google AI (Gemini) · HACK2SKILL Prompt Wars
        </motion.p>

        <motion.div
           initial={{ opacity: 0, y: 12 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ duration: 0.5, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
           className="flex flex-col sm:flex-row items-center gap-4"
         >
           {isAuthenticated ? (
             <button onClick={() => navigate('/dashboard')} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
               <Zap size={16} /> Go to Dashboard
             </button>
           ) : (
             <button onClick={() => navigate('/login')} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-black">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
               </svg>
               Login with Google
             </button>
           )}
           <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-glass w-full sm:w-auto">
             Back to Top
           </button>
         </motion.div>
      </div>

      {/* Bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © 2026 LifeSync AI. Built by Shanmukh Datta. All rights reserved.
        </span>
        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
          Built for HACK2SKILL · Prompt Wars
        </span>
      </div>
    </section>
  )
}
