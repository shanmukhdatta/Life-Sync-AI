import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Zap } from 'lucide-react'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const { login } = useAuth()
  const [searchParams] = useSearchParams()
  const error = searchParams.get('error')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const handleLogin = async () => {
    setIsLoggingIn(true)
    await login()
  }

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[420px] relative z-10"
      >
        <div 
          className="p-10 rounded-[32px] flex flex-col items-center text-center backdrop-blur-[20px]"
          style={{ 
            background: 'rgba(255,255,255,0.04)', 
            border: '1px solid rgba(255,255,255,0.08)' 
          }}
        >
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <Zap className="w-8 h-8 text-white" fill="white" />
          </div>
          
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-3">LifeSync AI</h1>
          <p className="text-white/50 text-sm mb-1">Not just an assistant.</p>
          <p className="text-white/50 text-sm mb-8">A life operating system.</p>

          {error === 'auth_failed' && (
            <div className="w-full p-4 mb-6 rounded-xl border" style={{ background: 'rgba(255,0,0,0.05)', borderColor: 'rgba(255,0,0,0.1)' }}>
              <p className="text-sm" style={{ color: 'rgba(255,100,100,0.9)' }}>
                Authentication failed. Please try again.
              </p>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-[56px] rounded-full bg-white text-black font-medium text-base flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-70 disabled:hover:scale-100"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-[11px] text-white/30 uppercase tracking-widest font-medium">
            © 2026 LifeSync AI · Built by Shanmukh Datta
          </p>
        </div>
      </motion.div>
    </div>
  )
}
