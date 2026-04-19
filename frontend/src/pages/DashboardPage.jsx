import { useState, useEffect } from 'react'
import api from '../utils/api'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Mail, Calendar as CalIcon, Activity, Clock, MapPin, Users, PlusCircle } from 'lucide-react'

export default function DashboardPage() {
  const [data, setData] = useState({ briefing: null, priority: null, burnout: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resBriefing, resPriority, resBurnout] = await Promise.all([
          api.get('/api/dashboard/briefing'),
          api.get('/api/dashboard/priority-score'),
          api.get('/api/fit/burnout-risk')
        ])
        setData({
          briefing: resBriefing.data,
          priority: resPriority.data,
          burnout: resBurnout.data
        })
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error) return <ErrorCard message={error} onRetry={() => window.location.reload()} />

  const { briefing } = data.briefing
  const calData = data.briefing.calendar
  const inboxData = data.briefing.inbox
  const burnoutRisk = data.burnout.burnout_risk

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Row 1: Morning Briefing Banner */}
      <section 
        className="p-6 rounded-[24px] relative overflow-hidden"
        style={{ 
          background: 'rgba(255,255,255,0.04)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)' 
        }}
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">{briefing.greeting}</h2>
            <p className="text-white/50">{briefing.urgent_email_summary}</p>
          </div>
          {briefing.context_alert && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border" style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
              <AlertTriangle className="w-4 h-4 text-white" />
              <span className="text-sm font-medium">{briefing.context_alert}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {briefing.top_priorities.map((task, i) => (
            <div key={i} className="p-4 rounded-xl border flex flex-col gap-3 transition-colors hover:bg-white-[0.02]" style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.05)' }}>
              <div className="flex justify-between items-start">
                <span className="text-white/30 font-mono text-sm leading-none">0{task.rank}</span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/10 bg-white/5">{task.tag}</span>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{task.title}</h3>
                <p className="text-xs text-white/50 leading-relaxed">{task.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Row 2: Stat Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={CalIcon} 
          title="Today's Calendar" 
          value={`${calData.today_events} Events`}
          subtext={calData.first_meeting ? `Next: ${calData.first_meeting.title} at ${calData.first_meeting.time}` : 'No upcoming meetings'}
          alert={calData.conflicts.length > 0 ? `${calData.conflicts.length} conflict(s)` : null}
        />
        <StatCard 
          icon={Mail} 
          title="Priority Inbox" 
          value={`${inboxData.unread_count} Unread`}
          subtext={`Act Now: ${inboxData.classified.act_now || 0} | Read Later: ${inboxData.classified.read_later || 0}`}
        />
        <StatCard 
          icon={Activity} 
          title="Health Context" 
          value={`Risk: ${burnoutRisk.risk_level.toUpperCase()}`}
          subtext={burnoutRisk.risk_level === 'low' ? 'You are well rested.' : 'Take a break today to recharge.'}
          alert={burnoutRisk.risk_level === 'high' ? 'High burnout risk' : null}
        />
      </section>

      {/* Row 3: Lists */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Emails */}
        <div className="p-6 justify-between rounded-[24px] flex flex-col gap-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex justify-between items-center">
            <h3 className="font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-white/50" /> Action Required Emails</h3>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-2">
            {inboxData.urgent_emails.length === 0 ? (
              <p className="text-sm text-white/50 bg-black/30 p-4 rounded-xl text-center">No urgent emails right now.</p>
            ) : (
              inboxData.urgent_emails.map((email, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-black/30 hover:border-white/10 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-white/50 font-medium truncate max-w-[150px]">{email.from}</span>
                  </div>
                  <p className="text-sm font-medium mb-2 leading-tight">{email.subject}</p>
                  <p className="text-xs text-white/40 line-clamp-2 leading-relaxed mb-3">{email.snippet}</p>
                  <button className="text-xs text-black bg-white px-3 py-1.5 rounded-full font-medium hover:bg-white/90">Draft Reply</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="p-6 rounded-[24px] flex flex-col gap-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex justify-between items-center">
            <h3 className="font-medium flex items-center gap-2"><CalIcon className="w-4 h-4 text-white/50" /> Schedule</h3>
          </div>
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[300px] pr-2">
            {calData.events.length === 0 ? (
               <p className="text-sm text-white/50 bg-black/30 p-4 rounded-xl text-center">Schedule is clear.</p>
            ) : (
              calData.events.map((ev, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-black/30 flex items-center gap-4 hover:border-white/10 transition-colors">
                  <div className="w-16 flex-shrink-0 text-center">
                    <span className="text-xs font-mono text-white/50 block">{(ev.start || "").slice(11, 16)}</span>
                  </div>
                  <div className="w-[1px] h-8 bg-white/10" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{ev.title}</p>
                    <div className="flex items-center gap-3 mt-1 opacity-50">
                      {ev.location && <span className="flex items-center gap-1 text-[10px]"><MapPin className="w-3 h-3" /> {ev.location}</span>}
                      {ev.attendees?.length > 0 && <span className="flex items-center gap-1 text-[10px]"><Users className="w-3 h-3" /> {ev.attendees.length}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </motion.div>
  )
}

function StatCard({ icon: Icon, title, value, subtext, alert }) {
  return (
    <div className="p-6 rounded-[20px] flex flex-col justify-between border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 rounded-full border flex items-center justify-center bg-white/5 border-white/10">
          <Icon className="w-5 h-5 text-white" />
        </div>
        {alert && (
          <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/20 bg-white/10 text-white font-medium">
            {alert}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs text-white/40 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-medium tracking-tight mb-2">{value}</p>
        <p className="text-sm text-white/60">{subtext}</p>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-[280px] rounded-[24px] bg-white/5" />
      <div className="grid grid-cols-3 gap-6">
        <div className="h-[180px] rounded-[20px] bg-white/5" />
        <div className="h-[180px] rounded-[20px] bg-white/5" />
        <div className="h-[180px] rounded-[20px] bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-[400px] rounded-[24px] bg-white/5" />
        <div className="h-[400px] rounded-[24px] bg-white/5" />
      </div>
    </div>
  )
}

export function ErrorCard({ message, onRetry }) {
  return (
    <div className="p-8 rounded-[24px] border flex flex-col items-center justify-center text-center min-h-[400px]" style={{ background: 'rgba(255,0,0,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}>
      <AlertTriangle className="w-8 h-8 text-white/50 mb-4" />
      <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
      <p className="text-sm text-white/50 mb-6 max-w-md">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-6 py-2 rounded-full border border-white/20 hover:bg-white/5 transition-colors text-sm">
          Retry Request
        </button>
      )}
    </div>
  )
}
