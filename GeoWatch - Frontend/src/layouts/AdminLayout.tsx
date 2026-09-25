import { useState } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, LayoutDashboard, LogOut, Map, Plus } from 'lucide-react'
import Background from '../components/Background'
import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import { clearAdminSession, getAdminId } from '../services/api'

function MobileNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const items = [
    { label: 'Home', icon: LayoutDashboard, to: '/admin/home' },
    { label: 'Events', icon: CalendarDays, to: '/admin/events' },
    { label: 'Create', icon: Plus, to: '/admin/create-event' },
    { label: 'Map', icon: Map, to: '/admin/events' },
  ]

  const handleLogout = () => {
    clearAdminSession()
    navigate('/')
  }

  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <div className="flex items-center justify-around rounded-2xl border border-mid/40 bg-surface/80 px-2 py-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
        {items.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.to || (item.to !== '/admin/home' && location.pathname.startsWith(item.to))
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => navigate(item.to)}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium transition ${
                active ? 'bg-deep text-[#ccd0cf]' : 'text-muted'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium text-muted transition hover:text-[#ccd0cf]"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </nav>
  )
}

function AdminLayout() {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('geowatch_sidebar') === 'collapsed')

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('geowatch_sidebar', next ? 'collapsed' : 'expanded')
      return next
    })
  }

  if (!getAdminId()) return <Navigate to="/signin" replace />

  return (
    <div className="min-h-screen pb-24 text-[#ccd0cf] lg:pb-0">
      <Background />

      {/* Fluid full-width dashboard layout */}
      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        {/* Sidebar container */}
        <div className="hidden h-screen shrink-0 sticky top-0 lg:block p-4 pr-2">
          <Sidebar collapsed={collapsed} onToggle={handleToggle} />
        </div>
        
        {/* Main Content Area */}
        <div className="flex min-w-0 flex-1 flex-col p-4 lg:p-4 lg:pl-2 min-h-screen">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.035] backdrop-blur-3xl shadow-[0_24px_60px_rgba(0,0,0,0.6)]">
            <Topbar />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  )
}

export default AdminLayout
