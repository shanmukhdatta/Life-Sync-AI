import { useState, useEffect } from 'react'
import api from '../utils/api'
import { motion } from 'framer-motion'
import { TrendingUp, RefreshCw, Receipt, DollarSign, Calendar as CalIcon, Plus, ExternalLink, Zap } from 'lucide-react'
import { ErrorCard } from './DashboardPage'

export default function FinancePage() {
  const [summaryData, setSummaryData] = useState(null)
  const [receiptsData, setReceiptsData] = useState({ receipts: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [receiptsLoading, setReceiptsLoading] = useState(false)

  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], amount: '', category: 'Food & Dining', description: '', loading: false })

  const sheetId = 'YOUR_LIFESYNC_SHEET_ID' // From backend default

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await api.get(`/api/finance/budget/${sheetId}`)
      setSummaryData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  const scanReceipts = async () => {
    setReceiptsLoading(true)
    try {
      const res = await api.get('/api/finance/receipts')
      setReceiptsData(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setReceiptsLoading(false)
    }
  }

  const handleLogExpense = async (e) => {
    e.preventDefault()
    setForm(prev => ({ ...prev, loading: true }))
    try {
      await api.post('/api/finance/log-expense', {
        sheet_id: sheetId,
        date: form.date,
        amount: Number(form.amount),
        category: form.category,
        description: form.description
      })
      setForm(prev => ({ ...prev, amount: '', description: '', loading: false }))
      fetchData() // Refresh summary
    } catch (err) {
      setForm(prev => ({ ...prev, loading: false }))
    }
  }

  const handleQuickForm = async () => {
    try {
      const res = await api.post('/api/forms/expense-entry')
      if (res.data?.form?.url) window.open(res.data.form.url, '_blank')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <FinanceSkeleton />
  if (error) return <ErrorCard message={error} onRetry={fetchData} />

  const { summary } = summaryData

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      
      {/* Top Banner: Budget Summary */}
      <div 
        className="p-8 rounded-[32px] border flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden" 
        style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-green-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-8 h-8 text-white/80" />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight mb-1">Budget Overview</h2>
            <p className="text-sm text-white/50">Google Sheets Integration</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 relative z-10 w-full md:w-auto text-center md:text-left">
          {Object.entries(summary).map(([key, val], i) => (
            <div key={i}>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-medium">{key.replace('_', ' ')}</p>
              <p className="text-2xl font-mono tracking-tight font-medium">
                {typeof val === 'number' && key !== 'row_count' ? `$${val.toFixed(2)}` : val}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Log Expense & Mobile Form */}
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-[24px] border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-lg font-medium tracking-tight flex items-center gap-2 mb-6">
              <Plus className="w-5 h-5 text-white/50" /> Log Expense Manually
            </h3>
            <form onSubmit={handleLogExpense} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">Date</label>
                  <input type="date" required value={form.date} onChange={e=>setForm(p=>({...p, date: e.target.value}))} className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">Amount</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input type="number" step="0.01" min="0" required placeholder="0.00" value={form.amount} onChange={e=>setForm(p=>({...p, amount: e.target.value}))} className="w-full h-11 pl-9 pr-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white placeholder-white/20" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">Category</label>
                  <select value={form.category} onChange={e=>setForm(p=>({...p, category: e.target.value}))} className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white [&>option]:bg-[#111]">
                    {['Food & Dining', 'Transportation', 'Entertainment', 'Groceries', 'Utilities', 'Shopping', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">Description</label>
                  <input type="text" required placeholder="What was this for?" value={form.description} onChange={e=>setForm(p=>({...p, description: e.target.value}))} className="w-full h-11 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white placeholder-white/20" />
                </div>
              </div>
              <button disabled={form.loading} className="w-full h-11 rounded-xl bg-white text-black font-medium text-sm flex items-center justify-center mt-2 hover:bg-white/90 transition-colors disabled:opacity-50">
                {form.loading ? <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : 'Append to Google Sheet'}
              </button>
            </form>
          </div>

          <div className="p-6 rounded-[24px] border flex flex-col items-center justify-center text-center gap-4 py-8" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
             <div className="w-12 h-12 rounded-full border flex items-center justify-center bg-white/5 border-white/10">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/50"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
             </div>
             <div>
               <h3 className="font-medium mb-1">Mobile Quick-Log Form</h3>
               <p className="text-xs text-white/50 max-w-[250px]">Generates a custom Google Form linked to your budget sheet for easy input on the go.</p>
             </div>
             <button onClick={handleQuickForm} className="mt-2 px-5 py-2.5 rounded-full border border-white/20 hover:bg-white/5 text-sm font-medium flex items-center gap-2 transition-colors">
               Create Form <ExternalLink className="w-3 h-3" />
             </button>
          </div>
        </div>

        {/* Right Column: AI Receipt Scanner */}
        <div className="flex flex-col min-h-0 border-l border-white/10 pl-0 lg:pl-8 mt-8 lg:mt-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-white/50" /> AI Inbox Scanner
            </h2>
            <button 
              onClick={scanReceipts}
              disabled={receiptsLoading}
              className="px-4 py-2 text-xs font-medium rounded-full border border-white/20 bg-white/5 hover:bg-white/10 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {receiptsLoading ? <><div className="w-3 h-3 border border-t-transparent border-white rounded-full animate-spin" /> Scanning...</> : <><RefreshCw className="w-3 h-3" /> Scan Inbox for Receipts</>}
            </button>
          </div>
          
          <p className="text-sm text-white/50 mb-6">LifeSync scans your recent emails for purchases, trips, and subscriptions, then extracts structured data to log in your budget.</p>

          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar min-h-[300px]">
            {receiptsLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-white/40">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-sm font-medium uppercase tracking-widest animate-pulse">Analyzing Inbox...</p>
              </div>
            ) : receiptsData.receipts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/30 border border-white/5 bg-white/[0.02] rounded-3xl p-10">
                <Receipt className="w-10 h-10 mb-4 opacity-50" />
                <p className="text-sm">Click "Scan Inbox" to find recent receipts.</p>
              </div>
            ) : (
              receiptsData.receipts.map((rcpt, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-4 transition-transform hover:bg-white/[0.07]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-base mb-1">{rcpt.merchant}</p>
                      <p className="text-xs text-white/40">{rcpt.email_subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-lg mb-1">${rcpt.amount.toFixed(2)}</p>
                      <p className="text-[10px] uppercase tracking-widest text-white/50">{rcpt.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-white/10">
                    <span className="text-xs px-2 py-1 rounded-md bg-white/10 text-white/80 font-medium">
                      Category: {rcpt.category}
                    </span>
                    <button className="text-xs font-medium px-4 py-1.5 rounded-full bg-white text-black hover:bg-white/90 transition-colors">
                      Log to Sheet
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </motion.div>
  )
}

function FinanceSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-[140px] rounded-[32px] bg-white/5 border border-white/10" />
      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="h-[360px] rounded-[24px] bg-white/5 border border-white/10" />
          <div className="h-[200px] rounded-[24px] bg-white/5 border border-white/10" />
        </div>
        <div className="h-[600px] rounded-[24px] bg-white/5 border border-white/10" />
      </div>
    </div>
  )
}
