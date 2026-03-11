import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerAdmin } from '../services/api'

type RegisterForm = {
  name: string
  email: string
  password: string
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AdminRegister() {
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterForm>({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!form.password.trim()) {
      setError('Password is required.')
      return
    }

    try {
      setLoading(true)
      await registerAdmin({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      navigate('/admin/login')
    } catch {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-xl bg-slate-800 p-8 shadow-sm">
      <h1 className="text-3xl font-bold">GeoWatch</h1>
      <p className="mt-2 text-slate-300">Admin Registration</p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-200" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition focus:border-cyan-400"
          />
        </div>

        {error && <p className="text-sm text-rose-300">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-300">
        Already registered?{' '}
        <Link to="/admin/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
          Login
        </Link>
      </p>
    </section>
  )
}

export default AdminRegister
