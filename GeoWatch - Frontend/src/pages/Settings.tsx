import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Mail, Shield, Bell, Map, KeyRound, Monitor } from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Reveal from '../components/Reveal'
import { clearAdminSession } from '../services/api'

function Settings() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({ name: 'Admin', email: '' })

  useEffect(() => {
    // Get info from localStorage session
    const storedEmail = localStorage.getItem('adminEmail') || sessionStorage.getItem('adminEmail') || 'admin@geowatch.com'
    const storedName = localStorage.getItem('adminName') || sessionStorage.getItem('adminName') || 'System Administrator'
    setProfile({
      name: storedName,
      email: storedEmail,
    })
  }, [])

  const handleLogout = () => {
    clearAdminSession()
    navigate('/signin')
  }

  return (
    <div className="w-full space-y-6">
      <Reveal>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-[#ccd0cf]">Profile</h1>
          <p className="text-sm text-muted">Manage your administrator profile, notification settings, and session status.</p>
        </div>
      </Reveal>

      {/* Admin Profile Section */}
      <Reveal delay={0.1}>
        <GlassCard className="p-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-4 flex items-center gap-2">
            <User className="h-4 w-4" />
            Administrator Profile
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-deep text-[#ccd0cf] border border-white/10 ring-2 ring-cyan-500/20 shadow-inner">
              <User className="h-8 w-8 text-cyan-400" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-base font-semibold text-[#ccd0cf] truncate">{profile.name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{profile.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Shield className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Verified Organizer</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </Reveal>

      {/* Preferences Section */}
      <Reveal delay={0.18}>
        <GlassCard className="p-6 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Application Preferences
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted" />
                <div className="text-left">
                  <p className="text-xs font-medium text-[#ccd0cf]">Safety SOS Sound Alerts</p>
                  <p className="text-[10px] text-muted">Play alarm sound when a new high-risk cluster forms</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-mid text-cyan-500 focus:ring-0 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <Map className="h-4 w-4 text-muted" />
                <div className="text-left">
                  <p className="text-xs font-medium text-[#ccd0cf]">Autofocus Event Center</p>
                  <p className="text-[10px] text-muted">Auto-zoom to incoming SOS clusters instantly</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-mid text-cyan-500 focus:ring-0 cursor-pointer" />
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl border border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-muted" />
                <div className="text-left">
                  <p className="text-xs font-medium text-[#ccd0cf]">Remember Session Cache</p>
                  <p className="text-[10px] text-muted">Keep administrator signed-in on this device</p>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="rounded border-mid text-cyan-500 focus:ring-0 cursor-pointer" />
            </div>
          </div>
        </GlassCard>
      </Reveal>

      {/* Danger Logout Section */}
      <Reveal delay={0.25}>
        <GlassCard className="p-6 border-rose-500/20 bg-rose-500/[0.01]">
          <h2 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">Account Management</h2>
          <p className="text-xs text-muted mb-4">Logging out will terminate your current session. You will need to log back in to monitor active geofence event zones.</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500/25 border border-rose-500/40 py-3 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/35 active:scale-95 shadow-lg"
          >
            <LogOut className="h-4 w-4" />
            Log Out Account
          </button>
        </GlassCard>
      </Reveal>
    </div>
  )
}

export default Settings
