import { useState, useEffect } from 'react'
import api from '../utils/api'
import { motion } from 'framer-motion'
import { Activity, Target, ExternalLink } from 'lucide-react'
import { ErrorCard } from './DashboardPage'

export default function HabitsPage() {
  const [burnoutData, setBurnoutData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await api.get('/api/fit/burnout-risk')
      setBurnoutData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load habit & health data')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenCheckin = async () => {
    try {
      const res = await api.get('/api/forms/habit-checkin')
      if (res.data?.form?.url) window.open(res.data.form.url, '_blank')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <HabitsSkeleton />
  if (error) return <ErrorCard message={error} onRetry={fetchData} />

  const { burnout_risk } = burnoutData

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 max-w-4xl mx-auto">
      
      {/* Burnout Risk Banner */}
      <div 
        className="p-8 rounded-[32px] border relative overflow-hidden"
        style={{ 
          background: burnout_risk.risk_level === 'high' ? 'rgba(255,0,0,0.05)' : 'rgba(255,255,255,0.02)', 
          borderColor: burnout_risk.risk_level === 'high' ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.08)' 
        }}
      >
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center ${burnout_risk.risk_level === 'high' ? 'border-red-500/30 bg-red-500/10' : 'border-white/10 bg-white/5'}`}>
              <Activity className={`w-6 h-6 ${burnout_risk.risk_level === 'high' ? 'text-red-400' : 'text-white'}`} />
            </div>
            <div>
              <h2 className="text-xl font-medium tracking-tight">Health Context</h2>
              <p className="text-white/50 text-sm">AI analysis based on recent schedule</p>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full border text-sm font-medium uppercase tracking-widest ${burnout_risk.risk_level === 'high' ? 'bg-red-500/20 border-red-500/30 text-red-200' : 'bg-white/10 border-white/20 text-white/80'}`}>
            {burnout_risk.risk_level} Risk
          </div>
        </div>

        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 relative z-10">
          <p className="font-medium text-lg mb-2">{burnout_risk.recommendation.action}</p>
          <p className="text-white/60 text-sm leading-relaxed">{burnout_risk.recommendation.reason}</p>
        </div>
        
        {burnout_risk.risk_level === 'high' && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Habit Check-in Card */}
        <div className="p-8 rounded-[32px] border text-center flex flex-col items-center justify-center min-h-[320px]" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Target className="w-8 h-8 text-white/70" />
          </div>
          <h3 className="text-xl font-medium mb-3">Daily Habit Check-in</h3>
          <p className="text-sm text-white/50 mb-8 max-w-[250px] leading-relaxed">
            Record your daily progress. Data is analyzed in your weekly review.
          </p>
          <button 
            onClick={handleOpenCheckin}
            className="px-6 py-3 rounded-full bg-white text-black font-medium text-sm flex items-center gap-2 hover:scale-[1.02] transition-transform"
          >
            Open Check-in Form <ExternalLink className="w-4 h-4 text-black/50" />
          </button>
        </div>
      </div>

    </motion.div>
  )
}

function HabitsSkeleton() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto animate-pulse">
      <div className="h-[240px] rounded-[32px] bg-white/5 border border-white/10" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-[320px] rounded-[32px] bg-white/5 border border-white/10" />
        <div className="h-[320px] rounded-[32px] bg-white/5 border border-white/10" />
      </div>
    </div>
  )
}
