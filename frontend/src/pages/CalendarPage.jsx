import { useState, useEffect } from 'react'
import api from '../utils/api'
import { motion } from 'framer-motion'
import { Calendar as CalIcon, Clock, AlertTriangle, FileText, CheckCircle, Plus } from 'lucide-react'
import { ErrorCard } from './DashboardPage'

export default function CalendarPage() {
  const [data, setData] = useState({ events: [], conflicts: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [focusForm, setFocusForm] = useState({ date: new Date().toISOString().split('T')[0], duration: 2, loading: false, success: false })
  const [backplanForm, setBackplanForm] = useState({ title: '', deadline: new Date().toISOString().split('T')[0], hours: 2, loading: false, success: false })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/calendar/events?days=7')
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load calendar data')
    } finally {
      setLoading(false)
    }
  }

  const handleFocusBlock = async (e) => {
    e.preventDefault()
    setFocusForm(prev => ({ ...prev, loading: true, success: false }))
    try {
      await api.post('/api/calendar/focus-block', {
        date: focusForm.date,
        duration_hours: focusForm.duration,
        title: "Deep Work — LifeSync"
      })
      setFocusForm(prev => ({ ...prev, loading: false, success: true }))
      fetchEvents()
      setTimeout(() => setFocusForm(prev => ({ ...prev, success: false })), 3000)
    } catch (err) {
      setFocusForm(prev => ({ ...prev, loading: false }))
    }
  }

  const handleBackplan = async (e) => {
    e.preventDefault()
    setBackplanForm(prev => ({ ...prev, loading: true, success: false }))
    try {
      await api.post('/api/calendar/backplan', {
        deadline: backplanForm.deadline + "T23:59:00Z",
        task_title: backplanForm.title,
        prep_hours: backplanForm.hours
      })
      setBackplanForm(prev => ({ ...prev, loading: false, success: true, title: '' }))
      fetchEvents()
      setTimeout(() => setBackplanForm(prev => ({ ...prev, success: false })), 3000)
    } catch (err) {
      setBackplanForm(prev => ({ ...prev, loading: false }))
    }
  }

  if (loading) return <CalendarSkeleton />
  if (error) return <ErrorCard message={error} onRetry={fetchEvents} />

  // Group events by date
  const eventsByDate = {}
  data.events.forEach(ev => {
    const d = (ev.start || "").split('T')[0]
    if (!eventsByDate[d]) eventsByDate[d] = []
    eventsByDate[d].push(ev)
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      
      {/* Top row: Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Block Focus Time */}
        <div className="p-6 rounded-[24px] border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="text-lg font-medium tracking-tight flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-white/50" /> Focus Block
          </h3>
          <form onSubmit={handleFocusBlock} className="flex flex-col gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-1 block">Date</label>
              <input 
                type="date" 
                required
                value={focusForm.date}
                onChange={e => setFocusForm(p => ({ ...p, date: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-1 block">Duration</label>
              <select 
                value={focusForm.duration}
                onChange={e => setFocusForm(p => ({ ...p, duration: Number(e.target.value) }))}
                className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white [&>option]:bg-[#111]"
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={3}>3 hours</option>
              </select>
            </div>
            <button 
              disabled={focusForm.loading}
              className="w-full h-11 rounded-full bg-white text-black font-medium text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {focusForm.loading ? <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : (focusForm.success ? 'Blocked!' : 'Block Now')}
            </button>
          </form>
        </div>

        {/* Meeting Prep */}
        <div className="p-6 rounded-[24px] border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h3 className="text-lg font-medium tracking-tight flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-white/50" /> Next Meeting
          </h3>
          {data.events.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm font-medium mb-1 truncate">{data.events[0].title}</p>
                <p className="text-xs text-white/50 mb-3">{data.events[0].start?.slice(11,16)} • {data.events[0].attendees?.length || 1} attendees</p>
                <button className="text-xs w-full py-2 border border-white/20 rounded-lg hover:bg-white/10 transition-colors">
                  Get Brief
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-white/30 py-6">
              <p className="text-sm">No upcoming meetings</p>
            </div>
          )}
        </div>

        {/* Conflict Alerts */}
        <div className="p-6 rounded-[24px] border flex flex-col" style={{ background: 'rgba(255,0,0,0.03)', borderColor: 'rgba(255,0,0,0.1)' }}>
          <h3 className="text-lg font-medium tracking-tight flex items-center gap-2 mb-4 text-red-100">
            <AlertTriangle className="w-5 h-5 text-red-400" /> Conflicts
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
            {data.conflicts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/30">
                <CheckCircle className="w-8 h-8 mb-3 opacity-50" />
                <p className="text-sm">Schedule is clear!</p>
              </div>
            ) : (
              data.conflicts.map((c, i) => (
                <div key={i} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
                  <p className="font-medium text-red-100 mb-1 line-clamp-1">{c.event_1} <span className="opacity-50 mx-1">vs</span> {c.event_2}</p>
                  <p className="text-xs text-red-200/70">{c.suggestion}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout for main area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 7-day Event List */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-medium tracking-tight mb-6">Upcoming 7 Days</h2>
          <div className="flex flex-col gap-8">
            {Object.keys(eventsByDate).sort().map(date => {
              const events = eventsByDate[date]
              return (
                <div key={date}>
                  <h3 className="text-sm font-medium uppercase tracking-widest text-white/50 mb-4 ml-1">{date}</h3>
                  <div className="flex flex-col gap-3">
                    {events.map((ev, i) => {
                      const isConflict = data.conflicts.some(c => c.event_1 === ev.title || c.event_2 === ev.title)
                      return (
                        <div key={i} className={`p-4 rounded-xl border flex items-center gap-4 transition-transform hover:translate-y-[-2px] ${isConflict ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/5'}`}>
                          <div className="w-16 flex-shrink-0 text-center">
                            <span className="text-sm font-mono text-white/70 block">{(ev.start || "").slice(11, 16)}</span>
                          </div>
                          <div className={`w-[1px] h-8 ${isConflict ? 'bg-red-500/30' : 'bg-white/10'}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-base font-medium truncate">{ev.title}</p>
                              {isConflict && <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                              {ev.location && <span>{ev.location}</span>}
                              {ev.attendees?.length > 0 && <span>{ev.attendees.length} attendees</span>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar forms */}
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-[24px] border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-lg font-medium tracking-tight mb-4">Deadline Backplanning</h3>
            <p className="text-sm text-white/50 mb-6 leading-relaxed">Let AI create backwards-planned prep sessions in your calendar for a major upcoming deadline.</p>
            
            <form onSubmit={handleBackplan} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-1 block">Task Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g., Q3 Board Report"
                  value={backplanForm.title}
                  onChange={e => setBackplanForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white placeholder-white/20" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-1 block">Deadline Date</label>
                <input 
                  type="date" 
                  required
                  value={backplanForm.deadline}
                  onChange={e => setBackplanForm(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-1 block">Total Prep Hours Needed</label>
                <input 
                  type="number" 
                  min="1" max="20"
                  required
                  value={backplanForm.hours}
                  onChange={e => setBackplanForm(p => ({ ...p, hours: Number(e.target.value) }))}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white" 
                />
              </div>
              <button 
                disabled={backplanForm.loading}
                className="w-full h-11 rounded-full border border-white/30 bg-transparent text-white font-medium text-sm flex items-center justify-center gap-2 mt-4 hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {backplanForm.loading ? <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" /> : (
                  backplanForm.success ? 'Sessions Scheduled!' : 'Auto-Schedule Prep'
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </motion.div>
  )
}

function CalendarSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="grid grid-cols-3 gap-6">
        <div className="h-[280px] rounded-[24px] bg-white/5" />
        <div className="h-[280px] rounded-[24px] bg-white/5" />
        <div className="h-[280px] rounded-[24px] bg-white/5" />
      </div>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 flex flex-col gap-4">
          <div className="h-16 rounded-xl bg-white/5" />
          <div className="h-16 rounded-xl bg-white/5" />
          <div className="h-16 rounded-xl bg-white/5" />
        </div>
        <div className="h-[400px] rounded-[24px] bg-white/5" />
      </div>
    </div>
  )
}
