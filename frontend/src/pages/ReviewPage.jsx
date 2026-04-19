import { useState } from 'react'
import api from '../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart2, Calendar, Mail, CheckCircle, TrendingUp, AlertCircle, Zap, RefreshCw } from 'lucide-react'
import { ErrorCard } from './DashboardPage'

export default function ReviewPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const generateReview = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/api/review/weekly')
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate weekly review')
    } finally {
      setLoading(false)
    }
  }

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8 min-h-[calc(100vh-140px)]">
      
      {!data && !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="p-12 md:p-16 rounded-[40px] border flex flex-col items-center text-center max-w-2xl relative overflow-hidden" 
               style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[400px] max-h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />
            
            <BarChart2 className="w-16 h-16 text-white/50 mb-8 relative z-10" />
            <h2 className="text-3xl font-medium tracking-tight mb-4 relative z-10">Weekly Life Review</h2>
            <p className="text-white/50 mb-10 text-lg max-w-lg leading-relaxed relative z-10">
              Synthesize your calendar, emails, tasks, and habits into one comprehensive AI report. See what went well, and what to focus on next.
            </p>
            <button 
              onClick={generateReview}
              className="h-14 px-8 rounded-full bg-white text-black font-medium flex items-center gap-3 hover:scale-[1.02] transition-transform relative z-10"
            >
              <Zap className="w-5 h-5" /> Generate Intelligence Report
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 border-2 border-white/10 rounded-full" />
            <div className="w-24 h-24 border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin absolute" />
            <BarChart2 className="w-8 h-8 text-white absolute" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium mb-1">Synthesizing Your Week</p>
            <p className="text-white/50 text-sm animate-pulse">Analyzing 10 data streams...</p>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <ErrorCard message={error} onRetry={generateReview} />
        </div>
      )}

      {data && !loading && (
        <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-10 max-w-5xl mx-auto w-full pb-10">
          
          <motion.div variants={item} className="flex justify-between items-end border-b border-white/10 pb-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50 font-medium mb-2">Intelligence Report</p>
              <h2 className="text-3xl font-medium tracking-tight">{data.date_range}</h2>
            </div>
            <button onClick={generateReview} className="text-xs font-medium px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors flex items-center gap-2">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </motion.div>

          {/* Core Stats */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-[24px] border border-white/10 bg-white/5 flex flex-col items-center text-center group hover:bg-white/10 transition-colors">
              <Calendar className="w-6 h-6 text-white/50 mb-4 group-hover:text-white transition-colors" />
              <p className="text-3xl font-mono font-medium mb-1">{data.metrics.meetings_count}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Meetings</p>
            </div>
            <div className="p-6 rounded-[24px] border border-white/10 bg-white/5 flex flex-col items-center text-center group hover:bg-white/10 transition-colors">
              <Mail className="w-6 h-6 text-white/50 mb-4 group-hover:text-white transition-colors" />
              <p className="text-3xl font-mono font-medium mb-1">{data.metrics.emails_received}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Emails Rx</p>
            </div>
            <div className="p-6 rounded-[24px] border border-white/10 bg-white/5 flex flex-col items-center text-center group hover:bg-white/10 transition-colors">
              <CheckCircle className="w-6 h-6 text-white/50 mb-4 group-hover:text-white transition-colors" />
              <p className="text-3xl font-mono font-medium mb-1">{data.metrics.tasks_completed}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Tasks Done</p>
            </div>
            <div className="p-6 rounded-[24px] border border-white/10 bg-white/5 flex flex-col items-center text-center group hover:bg-white/10 transition-colors">
              <TrendingUp className="w-6 h-6 text-white/50 mb-4 group-hover:text-white transition-colors" />
              <p className="text-3xl font-mono font-medium mb-1">${data.metrics.expenses_total}</p>
              <p className="text-[10px] uppercase tracking-widest text-white/50 font-medium">Spent</p>
            </div>
          </motion.div>

          {/* Qualitative Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div variants={item} className="p-8 rounded-[32px] border border-white/10 bg-white/[0.02] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />
              <h3 className="text-xl font-medium mb-6 relative z-10 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" /> Highlights
              </h3>
              <ul className="flex flex-col gap-4 relative z-10">
                {data.ai_synthesis?.highlights?.map((hl, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-green-400/50 mt-1.5 mt-0.5 text-xs">◆</span>
                    <span className="text-white/80 leading-relaxed block">{hl}</span>
                  </li>
                )) || <li className="text-white/50">No highlights generated.</li>}
              </ul>
            </motion.div>

            <motion.div variants={item} className="p-8 rounded-[32px] border border-white/10 bg-white/[0.02] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 blur-[80px] rounded-full pointer-events-none" />
              <h3 className="text-xl font-medium mb-6 relative z-10 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" /> Bottlenecks
              </h3>
              <ul className="flex flex-col gap-4 relative z-10">
                {data.ai_synthesis?.bottlenecks?.map((bn, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="text-red-400/50 mt-1.5 mt-0.5 text-xs">◆</span>
                    <span className="text-white/80 leading-relaxed block">{bn}</span>
                  </li>
                )) || <li className="text-white/50">No bottlenecks identified.</li>}
              </ul>
            </motion.div>
          </div>

          <motion.div variants={item} className="p-8 rounded-[32px] border border-white/10 bg-white/[0.04]">
            <h3 className="text-xl font-medium mb-6 flex items-center gap-3">
              <Zap className="w-5 h-5 text-blue-400" /> Next Week Focus
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.ai_synthesis?.next_week_focus?.map((foc, i) => (
                <div key={i} className="p-6 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-4">
                  <span className="text-2xl font-mono text-white/20 font-bold leading-none mt-1">0{i+1}</span>
                  <p className="text-white/90 leading-relaxed text-sm font-medium">{foc}</p>
                </div>
              )) || <p className="text-white/50">No focus areas identified.</p>}
            </div>
          </motion.div>

        </motion.div>
      )}
    </motion.div>
  )
}
