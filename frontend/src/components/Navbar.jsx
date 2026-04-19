import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Zap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const navLinks = [
  { label: 'Features', href: '#modules' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Personas', href: '#personas' },
  { label: 'Problem It Solves', href: '#why-wins' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleNav = (href) => {
    setMobileOpen(false)
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.06)',
          transition: 'all 300ms ease',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-12 flex items-center justify-between h-[64px]">
          {/* Logo */}
          <motion.a
            href="#"
            className="flex items-center gap-2 no-underline"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            whileHover={{ opacity: 0.8 }}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-white font-semibold text-[15px]" style={{ letterSpacing: '-0.02em' }}>
              LifeSync AI
            </span>
          </motion.a>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.href)}
                className="text-[14px] cursor-pointer bg-transparent border-none transition-colors duration-200"
                style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em' }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.9)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.5)'}
              >
                {link.label}
              </button>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-primary flex items-center gap-2"
                style={{ padding: '7px 16px', fontSize: '13px', fontWeight: 500 }}
              >
                {user?.picture ? (
                  <img src={user.picture} alt="Avatar" className="w-5 h-5 rounded-full mr-1" />
                ) : null}
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
                style={{ padding: '9px 20px', fontSize: '13px', fontWeight: 500 }}
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-white/70 hover:text-white transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-8"
            style={{
              background: 'rgba(0,0,0,0.95)',
              backdropFilter: 'blur(48px)',
              WebkitBackdropFilter: 'blur(48px)',
            }}
            aria-label="Mobile menu"
          >
            {navLinks.map((link, i) => (
              <motion.button
                key={link.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 + 0.1 }}
                onClick={() => handleNav(link.href)}
                className="text-white text-3xl font-semibold bg-transparent border-none cursor-pointer"
                style={{ letterSpacing: '-0.03em' }}
              >
                {link.label}
              </motion.button>
            ))}
            {isAuthenticated ? (
              <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
                Go to Dashboard
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="btn-primary mt-4">
                Login
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
