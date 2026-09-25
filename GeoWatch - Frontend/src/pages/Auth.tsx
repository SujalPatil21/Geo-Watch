import { useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { loginAdmin, registerAdmin, saveAdminSession } from '../services/api'
import geoWatchLogo from '../assets/MobAlert-Logo.png'

type AuthMode = 'signin' | 'signup'

interface AuthProps {
  mode: AuthMode
}

type FormState = {
  name: string
  email: string
  password: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* Atmospheric animated background — Apple-Maps-style light map + gradient blobs */
function AuthBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#06141b] via-[#0d1b26] to-[#06141b]" />

      {/* Map image from /img folder */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/img/map-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-deepest/40" />

      {/* animated color blobs drifting over the map (low opacity so the map image reads) */}
      <div className="animate-blob absolute -left-24 -top-24 h-[30rem] w-[30rem] rounded-full bg-surface/50 blur-3xl" />
      <div
        className="animate-blob absolute -right-28 top-1/4 h-[28rem] w-[28rem] rounded-full bg-deep/45 blur-3xl"
        style={{ animationDelay: '-5s' }}
      />
      <div
        className="animate-blob absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-mid/30 blur-3xl"
        style={{ animationDelay: '-9s' }}
      />

      <div className="bg-dots absolute inset-0 opacity-30" />
    </div>
  )
}

function Auth({ mode }: AuthProps) {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [shakeKey, setShakeKey] = useState(0)

  const isSignUp = mode === 'signup'

  const fail = (message: string) => {
    setError(message)
    setShakeKey((key) => key + 1)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (isSignUp && !form.name.trim()) {
      fail('Name is required.')
      return
    }
    if (!emailRegex.test(form.email)) {
      fail('Please enter a valid email address.')
      return
    }
    if (!form.password.trim() || (isSignUp && form.password.length < 8)) {
      fail('Password must be at least 8 characters.')
      return
    }

    try {
      setLoading(true)

      if (isSignUp) {
        await registerAdmin({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        })
        // The backend returns a simple success string, so we navigate to signin
        navigate('/signin')
        return
      }

      const data = await loginAdmin({
        email: form.email.trim(),
        password: form.password,
      })

      const adminId = data?.adminId ?? data?.id
      if (!adminId) {
        fail('Login succeeded but no admin ID was returned by the backend.')
        return
      }

      saveAdminSession(adminId, remember)
      navigate('/admin/home')
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? (requestError.response?.data?.message || requestError.response?.data?.error)
        : ''
      fail(message || (isSignUp ? 'Registration failed. Please try again.' : 'Login failed. Please check your credentials.'))
    } finally {
      setLoading(false)
    }
  }

  const fieldClass =
    'w-full rounded-xl border border-mid/60 bg-deep/50 px-4 py-3 text-sm text-[#ccd0cf] outline-none backdrop-blur transition placeholder:text-muted focus:border-light/80 focus:bg-deep/70 focus:ring-2 focus:ring-mid/30'

  const inputWrapper = 'relative'

  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-10">
      <AuthBackdrop />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="w-full max-w-[90vw] rounded-[24px] border border-light/25 bg-deepest/30 p-10 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl md:p-10"
        style={{ width: '420px' }}
      >
        {/* Brand wordmark */}
        <div className="text-center flex flex-col items-center gap-2">
          <div className="h-12 w-12 overflow-hidden rounded-xl bg-mid shadow-lg shadow-black/30">
            <img src={geoWatchLogo} alt="GeoWatch Logo" className="h-full w-full object-cover" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-muted">GeoWatch</p>
        </div>

        {/* Heading */}
        <div className="mt-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-[#ccd0cf]">
            {isSignUp ? (
              <>
                Create your <span className="text-gradient">account</span>
              </>
            ) : (
              <>
                Welcome <span className="text-gradient">back!</span>
              </>
            )}
          </h1>
          <p className="mx-auto mt-2 max-w-[320px] text-[13px] leading-snug text-muted">
            {isSignUp
              ? 'Create an organizer account to run events and watch live risk zones.'
              : 'Sign in to monitor live risk zones, manage events, and track incidents in real time.'}
          </p>
        </div>

        <motion.div key={shakeKey} animate={error ? { x: [0, -10, 10, -6, 6, 0] } : undefined} transition={{ duration: 0.4 }}>
          <form className="mt-7 space-y-4" onSubmit={onSubmit}>
            {isSignUp && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="auth-name">
                  Name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Organizer name"
                  className={fieldClass}
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="auth-email">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="you@example.com"
                className={fieldClass}
              />
            </div>

            <div className={inputWrapper}>
              <label className="mb-1.5 block text-xs font-medium text-muted" htmlFor="auth-password">
                Password
              </label>
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="••••••••"
                className={`${fieldClass} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-[34px] flex h-6 w-6 items-center justify-center text-muted transition hover:text-light"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setRemember((prev) => !prev)}
                  className="flex items-center gap-2 text-xs text-muted transition hover:text-light"
                >
                  <span
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-md border transition ${
                      remember
                        ? 'border-mid bg-[#9ba8ab] shadow shadow-black/40'
                        : 'border-mid/50 bg-deep/60'
                    }`}
                  >
                    {remember && <Check className="h-3 w-3 text-[#06141b]" />}
                  </span>
                  Remember me
                </button>

                <button
                  type="button"
                  className="text-xs font-medium text-muted/80 transition hover:text-light"
                  title="Contact support to reset your password"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-300"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#ccd0cf] px-4 py-[14px] text-sm font-semibold text-[#06141b] shadow-lg shadow-black/30 transition hover:scale-[1.02] hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              {loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </motion.div>

        {/* Divider */}
        <div className="hidden">
          <span className="h-px flex-1 bg-mid/40" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted">Or</span>
          <span className="h-px flex-1 bg-mid/40" />
        </div>

        {/* Secondary action — demo provider buttons */}
        <div className="hidden">
          <button
            type="button"
            disabled
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-mid/50 bg-surface text-sm font-semibold text-[#ccd0cf] backdrop-blur transition hover:border-light/40 hover:bg-deep active:scale-95 disabled:opacity-60"
          >
            <LockKeyhole className="h-4 w-4" />
            Email only
          </button>
          <button
            type="button"
            disabled
            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-mid/50 bg-surface text-sm font-semibold text-[#ccd0cf] backdrop-blur transition hover:border-light/40 hover:bg-deep active:scale-95 disabled:opacity-60"
          >
            <LockKeyhole className="h-4 w-4" />
            Email only
          </button>
        </div>
        <p className="hidden">Demo — both sign in with a shared organizer account.</p>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-muted">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <Link to="/signin" className="font-semibold text-gradient transition hover:opacity-80">
                Sign In
              </Link>
            </>
          ) : (
            <>
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-gradient transition hover:opacity-80">
                Sign Up
              </Link>
            </>
          )}
        </p>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted/70">
          <LockKeyhole className="h-3 w-3" />
          GeoWatch — Crowd Safety Intelligence
        </p>
      </motion.div>
    </div>
  )
}

export default Auth
