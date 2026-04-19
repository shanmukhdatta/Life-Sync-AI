import { useState, useEffect } from 'react'
import api from '../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Settings, ChevronRight, Zap, PenTool, X, Check, Copy } from 'lucide-react'
import { ErrorCard } from './DashboardPage'

export default function EmailPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [activeTab, setActiveTab] = useState('act_now')
  const [selectedEmail, setSelectedEmail] = useState(null)
  
  const [actionsPanel, setActionsPanel] = useState({ open: false, loading: false, items: [], emailId: null })
  const [draftModal, setDraftModal] = useState({ open: false, loading: false, content: '', tone: '', emailId: null })

  useEffect(() => {
    fetchInbox()
  }, [])

  const fetchInbox = async () => {
    try {
      const res = await api.get('/api/email/inbox')
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load inbox data')
    } finally {
      setLoading(false)
    }
  }

  const handleExtractActions = async (email) => {
    setActionsPanel({ open: true, loading: true, items: [], emailId: email.id })
    try {
      const res = await api.post('/api/email/extract-actions', {
        email_id: email.id || '',
        email_body: email.snippet || '',
        email_from: email.from || '',
        email_subject: email.subject || ''
      })
      setActionsPanel(prev => ({ ...prev, loading: false, items: res.data.action_items }))
    } catch (err) {
      setActionsPanel(prev => ({ ...prev, loading: false, items: [] }))
    }
  }

  const handleDraftReply = async (email) => {
    setDraftModal({ open: true, loading: true, content: '', tone: '', emailId: email.id })
    try {
      const res = await api.post('/api/email/draft-reply', {
        email_id: email.id || '',
        email_body: email.snippet || '',
        email_from: email.from || '',
        email_subject: email.subject || '',
        tone: 'professional'
      })
      setDraftModal(prev => ({ 
        ...prev, 
        loading: false, 
        content: res.data.draft, 
        tone: res.data.detected_tone 
      }))
    } catch (err) {
      setDraftModal(prev => ({ ...prev, loading: false, content: 'Failed to generate draft.' }))
    }
  }

  if (loading) return <EmailSkeleton />
  if (error) return <ErrorCard message={error} onRetry={fetchInbox} />

  const tabs = [
    { id: 'act_now', label: 'Act Now' },
    { id: 'read_later', label: 'Read Later' },
    { id: 'fyi_only', label: 'FYI Only' },
    { id: 'delegate', label: 'Delegate' }
  ]

  const currentEmails = data.classified[activeTab] || []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[calc(100vh-140px)] gap-6 relative">
      <div className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map(tab => {
            const count = (data.classified[tab.id] || []).length
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all ${
                  isActive 
                    ? 'bg-white text-black border-white' 
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-sm font-medium">{tab.label}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-black/10 text-black' : 'bg-white/10 text-white'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Email List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 custom-scrollbar">
          {currentEmails.length === 0 ? (
            <div className="flex-1 flex items-center justify-center border border-white/5 rounded-2xl bg-white/[0.02] text-white/30 text-sm">
              No emails in this category.
            </div>
          ) : (
            currentEmails.map((email, i) => (
              <div 
                key={i} 
                className="p-5 rounded-2xl border transition-all hover:bg-white/[0.02]"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="flex justify-between items-start mb-2 gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate mb-1">{email.from}</p>
                    <h3 className="text-base font-semibold truncate leading-tight text-white/90">{email.subject}</h3>
                  </div>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest whitespace-nowrap pt-1">
                    {email.date ? email.date.slice(0, 10) : 'Today'}
                  </span>
                </div>
                
                <p className="text-sm text-white/50 line-clamp-2 leading-relaxed mb-5">
                  {email.snippet}
                </p>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleExtractActions(email)}
                    className="text-xs font-medium flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    <Zap className="w-3 h-3" />
                    Extract Actions
                  </button>
                  <button 
                    onClick={() => handleDraftReply(email)}
                    className="text-xs font-medium flex items-center gap-2 px-4 py-2 rounded-full border border-transparent bg-white text-black hover:bg-white/90 transition-colors"
                  >
                    <PenTool className="w-3 h-3" />
                    Draft Reply
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Billing Emails */}
        {data.billing_emails && data.billing_emails.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-medium uppercase tracking-widest text-white/50 mb-4">Bills Detected</h3>
            <div className="flex flex-col gap-3">
              {data.billing_emails.map((bill, i) => (
                <div key={i} className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center text-sm">
                  <span className="truncate flex-1 pr-4">{bill.subject}</span>
                  <span className="text-white/50">{bill.from}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Items Slide Panel */}
      <AnimatePresence>
        {actionsPanel.open && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-[360px] flex-shrink-0 border-l border-white/10 pl-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm uppercase tracking-widest font-medium">Extracted Actions</h2>
              <button 
                onClick={() => setActionsPanel(prev => ({ ...prev, open: false }))}
                className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {actionsPanel.loading ? (
                <div className="flex-1 flex items-center justify-center h-40">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : actionsPanel.items.length === 0 ? (
                <p className="text-sm text-white/30 text-center py-10">No action items found.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {actionsPanel.items.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-white/10 bg-white/5">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-widest ${
                          item.priority === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/70'
                        }`}>
                          {item.priority}
                        </span>
                        {item.deadline && <span className="text-[10px] text-white/50">{item.deadline.slice(0,10)}</span>}
                      </div>
                      <p className="text-sm font-medium mb-3">{item.action}</p>
                      <button className="w-full py-1.5 border border-white/20 hover:bg-white/10 rounded-lg text-xs font-medium transition-colors">
                        Add to Tasks
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draft Modal Overlay */}
      <AnimatePresence>
        {draftModal.open && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-[600px] rounded-3xl border border-white/10 bg-[#0a0a0a] flex flex-col p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-medium tracking-tight">Smart Reply</h2>
                  {!draftModal.loading && draftModal.tone && (
                    <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full border border-white/20 bg-white/10 text-white">
                      Tone: {draftModal.tone}
                    </span>
                  )}
                </div>
                <button onClick={() => setDraftModal(prev => ({ ...prev, open: false }))} className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {draftModal.loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <textarea
                    value={draftModal.content}
                    onChange={(e) => setDraftModal(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full h-[240px] bg-white/5 border border-white/10 rounded-xl p-4 text-sm leading-relaxed resize-none focus:outline-none focus:border-white/30 text-white"
                  />
                  <div className="flex justify-end gap-3 mt-6">
                    <button 
                      onClick={() => navigator.clipboard.writeText(draftModal.content)}
                      className="px-5 py-2.5 rounded-full border border-white/20 text-sm font-medium hover:bg-white/5 flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> Copy
                    </button>
                    <button 
                      onClick={() => {
                        api.post('/api/email/create-draft', { content: draftModal.content }).catch(()=>console.log('mock draft saving'))
                        setDraftModal(p => ({...p, open: false}))
                      }}
                      className="px-5 py-2.5 rounded-full border border-transparent bg-white text-black text-sm font-medium hover:bg-white/90"
                    >
                      Save as Draft in Gmail
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EmailSkeleton() {
  return (
    <div className="flex h-full gap-6 animate-pulse">
      <div className="flex-1 flex flex-col gap-6">
        <div className="h-10 w-full max-w-[400px] bg-white/5 rounded-full" />
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
          <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
          <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
        </div>
      </div>
    </div>
  )
}
