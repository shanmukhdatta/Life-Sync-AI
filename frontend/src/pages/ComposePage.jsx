import { useState } from 'react'
import api from '../utils/api'
import { motion } from 'framer-motion'
import { PenTool, Copy, CheckCircle, Zap } from 'lucide-react'
import { ErrorCard } from './DashboardPage'

export default function ComposePage() {
  const [form, setForm] = useState({ purpose: '', tone: 'Professional', bullet_points: '', loading: false })
  const [generatedDoc, setGeneratedDoc] = useState(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const handleCompose = async (e) => {
    e.preventDefault()
    if (!form.purpose || !form.bullet_points) return
    setForm(prev => ({ ...prev, loading: true }))
    setError(null)
    setGeneratedDoc(null)
    
    try {
      const res = await api.post('/api/docs/compose', {
        purpose: form.purpose,
        tone: form.tone.toLowerCase(),
        bullet_points: form.bullet_points.split('\n').filter(Boolean)
      })
      
      setGeneratedDoc(res.data.doc_content)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate document')
    } finally {
      setForm(prev => ({ ...prev, loading: false }))
    }
  }

  const handleCopy = () => {
    if (!generatedDoc) return
    navigator.clipboard.writeText(generatedDoc)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col lg:flex-row gap-8 max-h-0 min-h-0 h-[calc(100vh-140px)]">
      
      {/* Left Column: Input Form */}
      <div className="w-full lg:w-[480px] flex-shrink-0 flex flex-col min-h-0 bg-transparent rounded-[24px]">
        <div className="p-8 rounded-[32px] border h-full flex flex-col" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="text-xl font-medium tracking-tight mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-white/50 border border-white/20 rounded-full p-0.5" /> Context-Aware Composer
          </h2>
          <p className="text-sm text-white/50 mb-8">Turn your scattered thoughts into polished communication.</p>
          
          <form onSubmit={handleCompose} className="flex flex-col gap-5 flex-1 min-h-0">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">What are you writing?</label>
              <input 
                type="text" required
                placeholder="e.g., Performance Review, Resignation Letter, Pitch Email"
                value={form.purpose} onChange={e => setForm(p => ({...p, purpose: e.target.value}))}
                className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white placeholder-white/20 transition-colors" 
              />
            </div>
            
            <div>
              <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">Voice & Tone</label>
              <select 
                value={form.tone} onChange={e => setForm(p => ({...p, tone: e.target.value}))}
                className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white [&>option]:bg-[#111] transition-colors"
              >
                {['Professional', 'Casual', 'Persuasive', 'Empathetic', 'Direct'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
              <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">Raw Thoughts / Brain Dump (1 per line)</label>
              <textarea 
                required
                placeholder="Needs to sound firm but polite.&#10;Mention the deadline is Friday.&#10;We can't accept the current proposal."
                value={form.bullet_points} onChange={e => setForm(p => ({...p, bullet_points: e.target.value}))}
                className="w-full flex-1 px-4 py-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white placeholder-white/20 resize-none transition-colors" 
              />
            </div>

            <button 
              disabled={form.loading || !form.purpose || !form.bullet_points}
              className="w-full h-14 rounded-full bg-white text-black font-medium flex items-center justify-center gap-2 mt-2 hover:bg-white/90 transition-colors disabled:opacity-70 disabled:hover:bg-white"
            >
              {form.loading ? <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : <><PenTool className="w-4 h-4" /> Synthesize Draft</>}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Result Box */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex justify-between items-center mb-6 pl-2">
          <h2 className="text-xl font-medium tracking-tight">Generated Output</h2>
          {generatedDoc && (
            <button 
              onClick={handleCopy}
              className="px-4 py-2 text-sm font-medium flex items-center gap-2 rounded-full border border-white/20 hover:bg-white/10 transition-colors"
            >
              {copied ? <><CheckCircle className="w-4 h-4 text-green-400" /> Copied</> : <><Copy className="w-4 h-4" /> Copy to Clipboard</>}
            </button>
          )}
        </div>

        <div className="flex-1 rounded-[32px] border relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}>
          {error ? (
            <div className="p-8 h-full flex items-center justify-center">
              <ErrorCard message={error} onRetry={() => setError(null)} />
            </div>
          ) : generatedDoc ? (
            <div className="p-8 h-full overflow-y-auto custom-scrollbar">
              <div 
                className="prose prose-invert max-w-none text-white/90 leading-relaxed font-serif text-lg py-4 px-6"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {generatedDoc}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-white/30 text-center p-12">
              <PenTool className="w-16 h-16 mb-6 opacity-20" />
              <p className="text-lg mb-2 font-medium">Your canvas is blank</p>
              <p className="text-sm max-w-xs leading-relaxed">Fill out the context on the left, and LifeSync AI will draft a perfectly structured document mirroring your intent.</p>
            </div>
          )}
        </div>
      </div>
      
    </motion.div>
  )
}
