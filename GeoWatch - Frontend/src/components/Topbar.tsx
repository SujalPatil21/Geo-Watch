import { useState, useRef, useEffect } from 'react'
import { Bell, ShieldAlert, UserCheck, Play, BatteryWarning } from 'lucide-react'

type NotificationItem = {
  id: number
  text: string
  time: string
  icon: typeof Bell
  color: string
}

function Topbar() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const notifications: NotificationItem[] = [
    {
      id: 1,
      text: 'SOS alert from Sector 5 geofence: High crowd density detected!',
      time: '2 mins ago',
      icon: ShieldAlert,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      id: 2,
      text: 'New organizer joined: Officer Ramesh Kumar',
      time: '15 mins ago',
      icon: UserCheck,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 3,
      text: "Geofence 'Campus Concert' is now live.",
      time: '1 hour ago',
      icon: Play,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 4,
      text: 'Battery level low on primary GPS gateway tracker.',
      time: '2 hours ago',
      icon: BatteryWarning,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ]

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="relative flex items-center justify-between border-b border-white/10 bg-white/[0.01] px-5 py-3.5">
      <div className="text-xs font-semibold text-muted">GeoWatch Command Center</div>

      {/* Notifications container with relative bounds */}
      <div className="relative flex items-center gap-2.5" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Notifications"
          className="relative flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-muted backdrop-blur transition hover:border-white/20 hover:bg-white/[0.04] hover:text-[#ccd0cf] active:scale-95"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-11 z-[999] w-80 rounded-2xl border border-white/10 bg-[#0c1920]/95 p-4 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Live Alert Feed</h3>
              <span className="text-[10px] text-muted">{notifications.length} active notifications</span>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {notifications.map((notif) => {
                const Icon = notif.icon
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 rounded-xl border p-2.5 text-left transition hover:bg-white/[0.02] ${notif.color}`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-current/25 bg-current/5">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-[11px] leading-relaxed font-medium text-[#ccd0cf] break-words">
                        {notif.text}
                      </p>
                      <p className="text-[9px] text-muted opacity-80">{notif.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Topbar