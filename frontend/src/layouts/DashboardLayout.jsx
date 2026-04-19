import { useEffect, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  Zap, LayoutDashboard, Mail, Calendar, Target, MessageSquare,
  FileText, TrendingUp, PenTool, MapPin, BarChart2,
  Settings, LogOut, Bell
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/dashboard/email', label: 'Email Intelligence', icon: Mail },
  { path: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { path: '/dashboard/habits', label: 'Habits & Goals', icon: Target },
  { path: '/dashboard/tasks', label: 'AI Tasks', icon: MessageSquare },
  { path: '/dashboard/docs', label: 'Documents', icon: FileText },
  { path: '/dashboard/finance', label: 'Finance', icon: TrendingUp },
  { path: '/dashboard/compose', label: 'Compose', icon: PenTool },
  { path: '/dashboard/location', label: 'Location', icon: MapPin },
  { path: '/dashboard/review', label: 'Weekly Review', icon: BarChart2 },
]

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const currentNavItem = navItems.find(item => item.path === location.pathname)
  const pageTitle = currentNavItem ? currentNavItem.label : 'Settings'

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  })

  return (
    <div className="flex h-screen bg-[#000000] text-white overflow-hidden">
      {/* Sidebar */}
      <aside 
        className="w-[240px] flex-shrink-0 flex flex-col h-full border-r"
        style={{ 
          background: 'rgba(255,255,255,0.03)', 
          borderColor: 'rgba(255,255,255,0.08)' 
        }}
      >
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <Zap className="w-6 h-6 text-white" fill="white" />
          <span className="font-bold tracking-wide">LifeSync AI</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-xl transition-all
                ${isActive 
                  ? 'bg-white/5 border border-white/10 text-white' 
                  : 'text-white/50 hover:text-white hover:bg-white-[0.02] border border-transparent'
                }
              `}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 flex flex-col gap-2">
          <button className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/50 hover:text-white transition-all w-full">
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-white/50 hover:text-white transition-all w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
          
          {user && (
            <div className="flex items-center gap-3 p-3 mt-2 rounded-xl bg-white/5 border border-white/5">
              {user.picture ? (
                <img src={user.picture} alt="Avatar" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">
                  {user.name ? user.name.charAt(0) : 'U'}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-xs font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-white/50 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <header 
          className="h-[72px] flex-shrink-0 flex items-center justify-between px-8 border-b z-10"
          style={{ 
            background: 'rgba(0,0,0,0.5)', 
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.08)' 
          }}
        >
          <h1 className="text-xl font-medium tracking-tight">{pageTitle}</h1>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{formattedTime}</span>
              <span className="text-xs text-white/50 uppercase tracking-widest">{formattedDate}</span>
            </div>
            <div className="w-[1px] h-8 bg-white/10"></div>
            <button className="relative text-white/50 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full"></span>
            </button>
            {user?.picture && (
              <img src={user.picture} alt="Profile" className="w-9 h-9 rounded-full border border-white/10" />
            )}
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-[1200px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
