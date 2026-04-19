import { useState, useEffect } from 'react'
import api from '../utils/api'
import { motion } from 'framer-motion'
import { MessageSquare, Plus, CheckCircle, Circle, Clock } from 'lucide-react'
import { ErrorCard } from './DashboardPage'

export default function TasksPage() {
  const [data, setData] = useState({ tasks: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({ title: '', due_date: '', notes: '', loading: false })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const res = await api.get('/api/tasks')
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!form.title) return
    setForm(prev => ({ ...prev, loading: true }))
    try {
      await api.post('/api/tasks', {
        title: form.title,
        due_date: form.due_date ? form.due_date + "T23:59:00Z" : null,
        notes: form.notes || null
      })
      setForm({ title: '', due_date: '', notes: '', loading: false })
      fetchTasks()
    } catch (err) {
      setForm(prev => ({ ...prev, loading: false }))
      console.error(err)
    }
  }

  const handleCompleteTask = async (taskId) => {
    try {
      // Optimistic update
      setData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(t => t.id !== taskId)
      }))
      await api.post(`/api/tasks/${taskId}/complete`)
    } catch (err) {
      fetchTasks() // revert on fail
    }
  }

  if (loading) return <TasksSkeleton />
  if (error) return <ErrorCard message={error} onRetry={fetchTasks} />

  const pendingTasks = data.tasks.filter(t => !t.completed)
  // Mock returns all pending but optionally we could show completed

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-8">
      
      {/* Left Column: Create Task */}
      <div className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-6">
        <div className="p-6 rounded-[24px] border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="text-xl font-medium tracking-tight mb-6 flex items-center gap-3">
            <Plus className="w-5 h-5 text-white/50" /> New Task
          </h2>
          <form onSubmit={handleCreateTask} className="flex flex-col gap-5">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">Task Title</label>
              <input 
                type="text" 
                required
                placeholder="What needs to be done?"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white placeholder-white/20 transition-colors" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">Due Date (Optional)</label>
              <input 
                type="date" 
                value={form.due_date}
                onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white transition-colors" 
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">Notes (Optional)</label>
              <textarea 
                placeholder="Add details..."
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full h-24 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white placeholder-white/20 resize-none transition-colors" 
              />
            </div>
            <button 
              disabled={form.loading || !form.title}
              className="w-full h-12 rounded-xl bg-white text-black font-medium text-sm flex items-center justify-center gap-2 mt-2 hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {form.loading ? <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : 'Add Task'}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Task List */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium tracking-tight">Active Tasks</h2>
          <span className="text-xs font-medium px-3 py-1 bg-white/10 rounded-full border border-white/10">
            {pendingTasks.length} Pending
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {pendingTasks.length === 0 ? (
            <div className="p-12 rounded-[24px] border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center text-center text-white/40">
              <CheckCircle className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium text-white/70 mb-1">You're all caught up!</p>
              <p className="text-sm">Enjoy your zero-task inbox.</p>
            </div>
          ) : (
            pendingTasks.map((task) => (
              <div 
                key={task.id} 
                className="p-5 rounded-2xl flex gap-4 group transition-all border border-white/5"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <button 
                  onClick={() => handleCompleteTask(task.id)}
                  className="mt-0.5 w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center text-transparent hover:border-white hover:text-white transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4 mb-1">
                    <p className="text-base font-medium group-hover:text-white transition-colors text-white/90 leading-tight">
                      {task.title}
                    </p>
                    {task.due && (
                      <span className="flex items-center gap-1.5 text-[10px] uppercase font-medium tracking-widest text-white/40 bg-white/5 px-2 py-1 rounded-md whitespace-nowrap">
                        <Clock className="w-3 h-3" /> {task.due.slice(0, 10)}
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p className="text-sm text-white/50 leading-relaxed mt-2 p-3 bg-black/40 rounded-xl border border-white/5">
                      {task.notes}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  )
}

function TasksSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-pulse">
      <div className="w-full lg:w-[380px] h-[500px] rounded-[24px] bg-white/5 border border-white/10" />
      <div className="flex-1 flex flex-col gap-4">
        <div className="h-8 w-32 bg-white/5 rounded-full mb-2" />
        <div className="h-24 bg-white/5 rounded-2xl border border-white/10" />
        <div className="h-24 bg-white/5 rounded-2xl border border-white/10" />
        <div className="h-24 bg-white/5 rounded-2xl border border-white/10" />
      </div>
    </div>
  )
}
