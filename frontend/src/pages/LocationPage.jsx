import { useState, useEffect } from 'react'
import api from '../utils/api'
import { motion } from 'framer-motion'
import { MapPin, Navigation, Clock, Search, Coffee } from 'lucide-react'
import { ErrorCard } from './DashboardPage'

export default function LocationPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchForm, setSearchForm] = useState({ query: '', location: '', loading: false, result: null })

  useEffect(() => {
    fetchContext()
  }, [])

  const fetchContext = async () => {
    try {
      const res = await api.get('/api/maps/context')
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load location context')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchForm.query) return
    setSearchForm(prev => ({ ...prev, loading: true, result: null }))
    try {
      const res = await api.post('/api/maps/search', {
        query: searchForm.query,
        location: searchForm.location || 'Current Location'
      })
      setSearchForm(prev => ({ ...prev, loading: false, result: res.data.places }))
    } catch (err) {
      setSearchForm(prev => ({ ...prev, loading: false }))
      console.error(err)
    }
  }

  if (loading) return <LocationSkeleton />
  // Do not fully block on error but show it inline so the search still works if possible
  const { current_location, nearby_places, upcoming_commute } = data || { current_location: 'Unknown', nearby_places: [], upcoming_commute: null }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
      
      {error && <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm">{error}</div>}

      {/* Top Banner: Context Overview */}
      <div className="p-8 rounded-[32px] border flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden" 
           style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
        
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <MapPin className="w-8 h-8 text-white/80" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1 font-medium">Estimated Context Area</p>
            <h2 className="text-2xl font-medium tracking-tight leading-none">{current_location}</h2>
          </div>
        </div>

        {upcoming_commute && upcoming_commute.destination && (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl relative z-10 w-full md:w-auto flex items-center gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1 font-medium">Next Commute</p>
              <p className="font-medium">{upcoming_commute.destination}</p>
            </div>
            <div className="w-[1px] h-8 bg-white/10" />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/50 mb-1 font-medium">Est. Drive</p>
              <p className="font-mono text-lg font-bold">{upcoming_commute.duration}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left: Nearby Suggestions (from context) */}
        <div>
          <h3 className="text-lg font-medium tracking-tight mb-6 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-white/50" /> Nearby Suggestions
          </h3>
          <div className="flex flex-col gap-4">
            {nearby_places.length === 0 ? (
               <div className="p-6 rounded-2xl border border-white/5 text-center text-white/40">No suggestions available.</div>
            ) : (
              nearby_places.map((place, i) => (
                <div key={i} className="p-5 rounded-2xl border transition-all hover:translate-x-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)' }}>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-lg text-white/90">{place.name}</h4>
                    <span className="text-[10px] uppercase px-2 py-1 bg-white/10 rounded-full font-medium tracking-widest">
                      {place.rating} ★
                    </span>
                  </div>
                  <p className="text-sm text-white/50 mb-3">{place.address}</p>
                  {place.status && (
                    <span className={`text-xs font-medium ${place.status.includes('Open') ? 'text-green-400' : 'text-red-400'}`}>
                      {place.status}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Search Intercept Form */}
        <div className="flex flex-col gap-6">
          <div className="p-8 rounded-[32px] border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-lg font-medium tracking-tight mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-white/50" /> Semantic Map Search
            </h3>
            <form onSubmit={handleSearch} className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/50 pl-1 mb-2 block">I'm looking for...</label>
                <input 
                  type="text" required
                  placeholder="Quiet cafe to work with fast WiFi"
                  value={searchForm.query} onChange={e => setSearchForm(p => ({...p, query: e.target.value}))}
                  className="w-full h-12 px-4 rounded-xl border border-white/10 bg-white/5 text-sm focus:outline-none focus:border-white/30 text-white placeholder-white/20" 
                />
              </div>
              <button 
                disabled={searchForm.loading}
                className="w-full h-12 rounded-xl bg-white text-black font-medium flex items-center justify-center gap-2 mt-2 hover:bg-white/90 disabled:opacity-70"
              >
                {searchForm.loading ? <div className="w-5 h-5 rounded-full border-2 border-black/20 border-t-black animate-spin" /> : 'Search Area'}
              </button>
            </form>
          </div>

          {searchForm.result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <h4 className="text-sm uppercase tracking-widest font-medium text-white/50 pl-2">Search Results</h4>
              {searchForm.result.length === 0 ? (
                <div className="p-6 rounded-2xl border border-white/5 text-center text-white/40 bg-white/[0.02]">No matches found.</div>
              ) : (
                searchForm.result.map((place, i) => (
                  <div key={i} className="p-5 rounded-2xl border border-white/10 bg-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-base">{place.name}</h4>
                      {place.rating && <span className="text-xs font-mono bg-white/10 px-2 py-0.5 rounded">{place.rating} ★</span>}
                    </div>
                    <p className="text-sm text-white/50 mb-2">{place.address}</p>
                    <button onClick={()=>window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`, '_blank')} className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
                      View on Google Maps <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}

        </div>

      </div>
    </motion.div>
  )
}

function LocationSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="h-[140px] rounded-[32px] bg-white/5 border border-white/10" />
      <div className="grid grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="h-8 w-40 bg-white/5 rounded-full mb-2" />
          <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
          <div className="h-32 bg-white/5 rounded-2xl border border-white/10" />
        </div>
        <div className="h-[280px] rounded-[32px] bg-white/5 border border-white/10" />
      </div>
    </div>
  )
}
