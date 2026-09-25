import { useLocation, useNavigate } from 'react-router-dom'
import geoWatchLogo from '../assets/MobAlert-Logo.png'
import {
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  User,
  TriangleAlert,
} from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

type NavItem = {
  label: string
  icon: typeof LayoutDashboard
  to: string
}

const navItems: NavItem[] = [
  { label: 'Events', icon: CalendarDays, to: '/admin/home' },
  { label: 'Incidents', icon: TriangleAlert, to: '/admin/events' },
  { label: 'Profile', icon: User, to: '/admin/settings' },
]

function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <aside
      className={`flex min-h-full flex-col rounded-[24px] border border-white/10 bg-white/[0.025] p-3.5 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 ease-out ${
        collapsed ? 'w-[78px]' : 'w-[200px]'
      }`}
    >
      <button
        type="button"
        onClick={() => navigate('/admin/home')}
        title="GeoWatch"
        className={`flex items-center gap-3 rounded-xl py-3 transition ${
          collapsed ? 'justify-center w-full px-0' : 'px-2'
        }`}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mid shadow-lg shadow-black/30 overflow-hidden">
          <img src={geoWatchLogo} alt="GeoWatch Logo" className="h-full w-full object-cover" />
        </span>
        {!collapsed && <span className="whitespace-nowrap text-base font-bold tracking-tight text-[#ccd0cf]">GeoWatch</span>}
      </button>

      <nav className="mt-4 flex flex-1 flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname.startsWith(item.to)
          const content = (
            <>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  active
                    ? 'bg-deep text-[#ccd0cf] shadow-[0_0_16px_rgba(74,92,106,0.5)] ring-1 ring-mid'
                    : 'text-muted hover:text-[#ccd0cf]'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              {!collapsed && (
                <span className={`whitespace-nowrap text-sm font-medium ${active ? 'text-[#ccd0cf]' : 'text-muted'}`}>
                  {item.label}
                </span>
              )}
            </>
          )

          return (
            <button
              key={item.label}
              type="button"
              title={item.label}
              onClick={() => navigate(item.to)}
              className={`relative flex items-center gap-3 rounded-xl py-1 transition ${
                active ? 'bg-deep/50' : 'hover:bg-deep/40'
              } ${collapsed ? 'justify-center w-full px-0' : 'px-2'}`}
            >
              {active && !collapsed && (
                <span className="absolute -left-3 h-7 w-[3px] rounded-full bg-[#9ba8ab]/80 shadow-[0_0_10px_rgba(156,168,171,0.6)]" />
              )}
              {content}
            </button>
          )
        })}
      </nav>

      <div className="mt-auto space-y-2 pt-4">
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? 'Expand' : 'Collapse'}
          className={`flex w-full items-center gap-3 rounded-xl border-t border-mid/40 pt-3 text-muted transition hover:text-[#ccd0cf] ${
            collapsed ? 'justify-center px-0' : 'px-2'
          }`}
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
          {!collapsed && <span className="text-xs font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
