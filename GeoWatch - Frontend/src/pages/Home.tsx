import { Link } from 'react-router-dom'

const howItWorksSteps = [
  'User reports an incident from the mobile app.',
  'User location is validated using geofencing to confirm they are inside the event boundary.',
  'The backend analyzes incidents using clustering algorithms.',
  'Admins monitor incident clusters and risk heatmaps on a real-time dashboard map.',
]

const features = [
  'Real-time incident reporting',
  'Geo-fencing based event monitoring',
  'AI-based hotspot detection',
  'Live dashboard monitoring',
  'Heatmap visualization of risk zones',
]

function Home() {
  return (
    <div id="home" className="space-y-12">
      <nav className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xl font-bold tracking-tight text-slate-900">GeoWatch</p>

          <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-600">
            <a className="hover:text-slate-900" href="#home">
              Home
            </a>
            <a className="hover:text-slate-900" href="#about">
              About
            </a>
            <a className="hover:text-slate-900" href="#features">
              Features
            </a>
            <a className="hover:text-slate-900" href="#how-it-works">
              How It Works
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/admin/login"
              className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Admin Access
            </Link>
          </div>
        </div>
      </nav>

      <section className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 p-10 text-white shadow-lg">
        <div className="max-w-3xl space-y-5">
          <h1 className="text-3xl font-bold leading-tight md:text-5xl">
            GeoWatch - AI Powered Crowd Safety Monitoring
          </h1>
          <p className="text-base text-slate-200 md:text-lg">
            GeoWatch is a geofence-enabled crowd risk intelligence system for large public events where participants submit geo-tagged incident reports through a mobile application, and the backend clusters these reports to detect emerging danger zones that appear as real-time heatmaps on the admin monitoring dashboard.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="#mobile-app"
              className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300"
            >
              Download Mobile App
            </a>
          </div>
        </div>
      </section>

      <section id="about" className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">About</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">The Problem</h3>
            <p className="mt-3 text-slate-600">
              Large public events such as concerts, festivals, and college gatherings often face safety risks including harassment incidents and delayed reporting.
            </p>
          </article>
          <article className="rounded-xl bg-slate-50 p-6">
            <h3 className="text-lg font-semibold text-slate-900">The GeoWatch Solution</h3>
            <p className="mt-3 text-slate-600">
              GeoWatch allows participants to report incidents through a mobile application, while the backend analyzes reports and detects danger zones that are visualized on an admin monitoring dashboard.
            </p>
          </article>
        </div>
      </section>

      <section id="how-it-works" className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">How It Works</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {howItWorksSteps.map((step, index) => (
            <article key={step} className="rounded-xl bg-slate-50 p-6">
              <p className="text-sm font-semibold text-cyan-700">Step {index + 1}</p>
              <p className="mt-3 text-slate-700">{step}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Features</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <article key={feature} className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-lg font-semibold text-slate-900">{feature}</h3>
            </article>
          ))}
        </div>
      </section>

      <section id="mobile-app" className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Mobile App</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Users can download the Android mobile app to report incidents instantly during events and help build real-time crowd safety awareness.
        </p>
        <a
          href="#"
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-emerald-500"
        >
          Download APK
        </a>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
        <p className="mt-3 max-w-3xl text-slate-600">
          Event organizers can create events and monitor crowd safety through a real-time dashboard with live zone visibility and incident trends.
        </p>
      </section>

      <footer className="rounded-2xl bg-slate-900 p-8 text-slate-100 shadow-sm">
        <p className="text-xl font-bold">© 2026 GeoWatch - Crowd Safety Intelligence System</p>
        <p className="mt-5 text-sm text-slate-300">Support: geowatch.support@email.com</p>
      </footer>
    </div>
  )
}

export default Home
