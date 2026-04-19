import { useState, useEffect } from 'react'
import api from '../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Search, Plus, ExternalLink, Zap, Clock, Users } from 'lucide-react'
import { ErrorCard } from './DashboardPage'

export default function DocsPage() {
  const [driveData, setDriveData] = useState({ files: [] })
  const [notesData, setNotesData] = useState({ notes: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [noteForm, setNoteForm] = useState({ title: '', attendees: '', keyPoints: '', loading: false })
  const [generatedNote, setGeneratedNote] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [resDrive, resNotes] = await Promise.all([
        api.get('/api/drive/recent'),
        api.get('/api/docs/notes')
      ])
      setDriveData(resDrive.data)
      setNotesData(resNotes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load docs data')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateNotes = async (e) => {
    e.preventDefault()
    if (!noteForm.title) return
    setNoteForm(prev => ({ ...prev, loading: true }))
    setGeneratedNote(null)
    
    try {
      const res = await api.post('/api/docs/meeting-notes', {
        title: noteForm.title,
        attendees: noteForm.attendees.split(',').map(s => s.trim()).filter(Boolean),
        key_points: [noteForm.keyPoints],
        action_items: [] // handled internally by backend prompt mostly
      })
      
      setGeneratedNote(res.data.doc_content)
      setNoteForm(prev => ({ ...prev, loading: false }))
      // Refresh notes list
      const updatedNotes = await api.get('/api/docs/notes')
      setNotesData(updatedNotes.data)
      
    } catch (err) {
      setNoteForm(prev => ({ ...prev, loading: false }))
      console.error(err)
    }
  }

  if (loading) return <DocsSkeleton />
  if (error) return <ErrorCard message={error} onRetry={fetchData} />

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col xl:flex-row gap-8 min-h-0">
      
      {/* Left Column: AI Note Generator & Captured Notes */}
      <div className="flex-1 flex flex-col gap-6 min-h-0">
        
        {/* Generator Form */}
        <div className="p-6 rounded-[24px] border shrink-0" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="text-xl font-medium tracking-tight mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-white/50" /> AI Meeting Notes
          </h2>
          <form onSubmit={handleGenerateNotes} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-1 block">Meeting Title</label>
                <input 
                  type="text" required
                  placeholder="e.g., Weekly Sync"
                  value={noteForm.title} onChange={e => setNoteForm(p => ({...p, title: e.target.value}))}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white" 
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-1 block">Attendees (comma separated)</label>
                <input 
                  type="text"
                  placeholder="John, Sarah"
                  value={noteForm.attendees} onChange={e => setNoteForm(p => ({...p, attendees: e.target.value}))}
                  className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white" 
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-1 block">Brain dump / Raw transcript</label>
              <textarea 
                placeholder="Paste rough notes here..."
                value={noteForm.keyPoints} onChange={e => setNoteForm(p => ({...p, keyPoints: e.target.value}))}
                className="w-full h-24 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white resize-none" 
              />
            </div>
            
            {generatedNote && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 mb-2">
                <div className="p-4 rounded-xl border border-white/10 bg-black/50 text-sm whitespace-pre-wrap text-white/80 max-h-[200px] overflow-y-auto custom-scrollbar">
                  {generatedNote}
                </div>
              </motion.div>
            )}

            <button 
              disabled={noteForm.loading}
              className="w-full h-11 rounded-full bg-white text-black font-medium text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
            >
              {noteForm.loading ? <div className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : 'Generate Structured Notes'}
            </button>
          </form>
        </div>

        {/* Captured Notes Feed */}
        <div className="flex-1 flex flex-col min-h-0">
          <h3 className="text-sm font-medium uppercase tracking-widest text-white/50 mb-4 px-2">Recent Notes</h3>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar">
            {notesData.notes.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-10">No recent notes found.</p>
            ) : (
              notesData.notes.map((note, i) => (
                <div key={i} className="p-4 rounded-[20px] border flex gap-4 transition-all hover:bg-white/[0.02]" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-base font-medium truncate pr-4 text-white/90">{note.title}</h4>
                      <span className="text-[10px] text-white/40 uppercase tracking-widest whitespace-nowrap pt-1">
                        {note.date ? note.date.slice(0,10) : 'Today'}
                      </span>
                    </div>
                    <p className="text-sm text-white/50 line-clamp-2 leading-relaxed mb-3">{note.snippet}</p>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      {note.attendees && note.attendees.length > 0 && (
                        <span className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {note.attendees.length}</span>
                      )}
                      <button onClick={()=>window.open(note.url, '_blank')} className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors">
                        Open in Google Docs <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Google Drive Activity */}
      <div className="w-full xl:w-[400px] flex-shrink-0 flex flex-col border-l border-white/10 pl-0 xl:pl-8 mt-8 xl:mt-0 min-h-0">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium tracking-tight">Drive Activity</h2>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50">
            <Search className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar">
          {driveData.files.length === 0 ? (
            <p className="text-white/30 text-sm text-center py-10">No recent Drive activity.</p>
          ) : (
            driveData.files.map((file, i) => (
              <a 
                href={file.url} target="_blank" rel="noreferrer"
                key={i} 
                className="p-4 rounded-xl border flex flex-col gap-2 transition-transform hover:translate-x-1"
                style={{ background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.05)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {file.mimeType.includes('document') ? <FileText className="w-4 h-4 text-blue-400" /> : 
                     file.mimeType.includes('spreadsheet') ? <div className="w-4 h-4 rounded-sm bg-green-500/20 flex items-center justify-center border border-green-500/30"><div className="w-2 h-0.5 bg-green-400" /></div> :
                     <FileText className="w-4 h-4 text-white/50" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-white/90">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-white/30" />
                      <span className="text-[10px] uppercase tracking-widest text-white/40">{file.modifiedTime ? file.modifiedTime.slice(0,10) : 'Recent'}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </motion.div>
  )
}

function DocsSkeleton() {
  return (
    <div className="flex flex-col xl:flex-row gap-8 animate-pulse">
      <div className="flex-1 flex flex-col gap-6">
        <div className="h-[360px] rounded-[24px] bg-white/5 border border-white/10" />
        <div className="h-10 w-32 bg-white/5 rounded-full" />
        <div className="flex flex-col gap-4">
          <div className="h-32 bg-white/5 rounded-[20px] border border-white/10" />
          <div className="h-32 bg-white/5 rounded-[20px] border border-white/10" />
        </div>
      </div>
      <div className="w-full xl:w-[400px] flex flex-col gap-4">
        <div className="h-8 w-40 bg-white/5 rounded-full mb-2" />
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-xl" />
        <div className="h-20 bg-white/5 rounded-xl" />
      </div>
    </div>
  )
}
