import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Activity,
  ArrowRight,
  Download,
  Info,
  MapPin,
  QrCode,
  Radar,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import GlassCard from '../components/GlassCard'
import Reveal from '../components/Reveal'
import Counter from '../components/Counter'
import RiskBadge from '../components/dashboard/RiskBadge'

const apkUrl = 'https://github.com/SujalPatil21/Geo-Watch/releases/download/v1.0.0/GeoWatch.apk'
const demoUrl = '/admin/home'

const howItWorksSteps = [
  'User reports an incident from the mobile app.',
  'User location is validated using geofencing to confirm they are inside the event boundary.',
  'The backend analyzes incidents using clustering algorithms.',
  'Admins monitor incident clusters and risk heatmaps on a real-time dashboard map.',
]

const features = [
  { title: 'Real-time reporting', description: 'SOS alerts with live GPS coordinates, delivered instantly.', icon: Zap },
  { title: 'Geo-fenced monitoring', description: 'Every report is validated against the event boundary.', icon: MapPin },
  { title: 'Automated hotspot detection', description: 'DBSCAN clustering surfaces emerging danger zones.', icon: Radar },
  { title: 'Live dashboard', description: 'Organizers track crowd safety on a real-time map.', icon: Activity },
  { title: 'Risk heatmaps', description: 'Cyan-graded heatmap visualization of risk intensity.', icon: Radio },
  { title: 'WebSocket updates', description: 'Clusters refresh live without reloading the page.', icon: Sparkles },
]

const stats = [
  { label: 'Requests handled', value: 732, suffix: '/s' },
  { label: 'Live clients', value: 500, suffix: '+' },
  { label: 'Message delivery', value: 100, suffix: '%' },
  { label: 'Clustering latency', value: 0.92, suffix: 'ms', decimals: 2 },
]

const navItems = [
  { label: 'Overview', href: '#overview', icon: Info },
  { label: 'How it works', href: '#how-it-works', icon: Radar },
  { label: 'Features', href: '#features', icon: Sparkles },
  { label: 'Download app', href: '#download', icon: Download },
]

const mapZones = [
  { label: 'Stage left', pos: { left: '18%', top: '32%' }, color: 'rgba(244,63,94,0.85)', glow: 'bg-rose-500/35', pulse: true },
  { label: 'Food court', pos: { left: '50%', top: '64%' }, color: 'rgba(245,158,11,0.85)', glow: 'bg-amber-500/30', pulse: false },
  { label: 'Gate 2', pos: { left: '80%', top: '36%' }, color: 'rgba(16,185,129,0.85)', glow: 'bg-emerald-500/25', pulse: false },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: 'easeOut' as const },
  }),
}

function MiniMap() {
  return (
    <div className="relative h-52 overflow-hidden rounded-xl border border-mid/40 bg-deep">
      <img src="/img/risk-map-bg-v2.png" alt="Live event risk heatmap" className="absolute inset-0 h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-br from-deepest/45 via-surface/30 to-deepest/60" />

      {/* heat glow blobs per zone (semantic risk colors kept) */}
      <div className={`absolute h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${mapZones[0].glow} animate-pulse`} style={mapZones[0].pos} />
      <div className={`absolute h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${mapZones[1].glow}`} style={mapZones[1].pos} />
      <div className={`absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${mapZones[2].glow}`} style={mapZones[2].pos} />

      {/* zone markers */}
      {mapZones.map((zone) => (
        <span key={zone.label} className="absolute -translate-x-1/2 -translate-y-1/2" style={zone.pos}>
          {zone.pulse && (
            <span className="absolute inline-flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full" style={{ background: zone.color }} />
          )}
          <span className="relative flex h-3.5 w-3.5 rounded-full ring-2 ring-light/50" style={{ background: zone.color, boxShadow: `0 0 14px ${zone.color}` }} />
          <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap rounded border border-mid/50 bg-surface/85 px-1.5 py-0.5 text-[9px] font-medium text-light backdrop-blur">
            {zone.label}
          </span>
        </span>
      ))}
    </div>
  )
}

function LiveMonitoringCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="relative hidden lg:block"
    >
      <div className="pointer-events-none absolute -inset-8 rounded-[36px] bg-mid/25 blur-3xl" />

      <div className="relative aspect-[16/11] min-h-[360px] overflow-hidden rounded-2xl border border-mid/50 bg-surface/70 shadow-2xl shadow-black/50 backdrop-blur-2xl">
        <img src="/img/risk-map-bg-v2.png" alt="Live crowd-safety risk heatmap" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-deepest/10 via-transparent to-deepest/35" />
        <div className="hidden">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-[#ccd0cf]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="risk-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400/80" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            LIVE MONITORING
          </p>
          <span className="text-xs font-medium text-muted">Campus Fest</span>
        </div>

        <MiniMap />

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-mid/40 bg-deep/50 p-3 backdrop-blur">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Clusters</p>
            <p className="mt-1 text-2xl font-bold text-light">
              <Counter value={6} />
            </p>
          </div>
          <div className="rounded-xl border border-mid/40 bg-deep/50 p-3 backdrop-blur">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Reports</p>
            <p className="mt-1 text-2xl font-bold text-[#ccd0cf]">
              <Counter value={18} />
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-mid/40 bg-deep/50 px-3 py-2 backdrop-blur">
            <span className="text-sm font-medium text-light">Stage left zone</span>
            <RiskBadge level="HIGH" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-mid/40 bg-deep/50 px-3 py-2 backdrop-blur">
            <span className="text-sm font-medium text-light">Food court zone</span>
            <RiskBadge level="MEDIUM" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-mid/40 bg-deep/50 px-3 py-2 backdrop-blur">
            <span className="text-sm font-medium text-light">Gate 2 zone</span>
            <RiskBadge level="LOW" />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted">
          <Radar className="h-4 w-4 text-muted" />
          Clustered 18 reports into 6 zones
        </div>
      </div>
      </div>

    </motion.div>
  )
}

function Home() {
  return (
    <div className="min-h-screen lg:pl-28">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/img/risk-map-bg.png')" }}
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_70%_20%,rgba(74,92,106,0.3),transparent_38%),linear-gradient(rgba(6,20,27,0.82),rgba(6,20,27,0.94))]" />

      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-x-3 top-3 z-30 flex h-14 items-center justify-between rounded-2xl border border-mid/40 bg-surface/90 px-3 shadow-2xl shadow-black/40 backdrop-blur-xl lg:inset-y-0 lg:left-0 lg:right-auto lg:h-screen lg:w-24 lg:flex-col lg:rounded-none lg:border-y-0 lg:border-l-0 lg:px-0 lg:py-6"
      >
        <a href="#top" aria-label="GeoWatch home" title="GeoWatch home" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-light text-deepest shadow-lg shadow-black/30">
          <ShieldCheck className="h-5 w-5" />
        </a>

        <nav aria-label="Landing page navigation" className="flex items-center gap-1 lg:flex-col lg:gap-3">
          {navItems.map(({ label, href, icon: Icon }) => (
            <a
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-mid/30 bg-surface/50 text-muted shadow-lg shadow-black/20 backdrop-blur-xl transition hover:border-light/40 hover:bg-deep/80 hover:text-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </nav>

        <Link
          to="/signup"
          aria-label="Sign up"
          title="Sign up"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-light text-deepest shadow-lg shadow-black/30 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-light"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
      </motion.aside>

      <main id="top" className="mx-auto min-w-0 max-w-[1400px] space-y-20 pt-20 lg:pt-0">
        {/* Hero — full-width, asymmetric, LIVE map card */}
        <section className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="gradient-border relative overflow-hidden rounded-[28px] p-8 md:p-12"
          >
            <div className="animate-blob pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-deep/80 blur-3xl" />
            <div className="animate-blob pointer-events-none absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-surface/90 blur-3xl" style={{ animationDelay: '-6s' }} />
            <div className="animate-blob pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 rounded-full bg-mid/40 blur-3xl" style={{ animationDelay: '-9s' }} />

            <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full border border-mid/60 bg-deep/60 px-4 py-1.5 text-xs font-semibold text-light"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Real-time crowd safety intelligence
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.55 }}
                  className="text-4xl font-bold leading-tight text-[#ccd0cf] md:text-6xl"
                >
                  GeoWatch – <span className="text-gradient">Real-Time</span> Crowd Safety Monitoring
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.42, duration: 0.55 }}
                  className="max-w-xl text-base leading-relaxed text-muted md:text-lg"
                >
                  Geo-fenced incident reports fuse into live risk zones. Participants alert from the mobile app, the backend
                  clusters danger in real time, and organizers watch evolving heatmaps on one dashboard.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.54, duration: 0.55 }}
                  className="flex flex-wrap items-center gap-3 pt-2"
                >
                  <Link to="/signup" className="btn-primary gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href={apkUrl} className="btn-ghost gap-2">
                    <Download className="h-4 w-4" />
                    Download APK
                  </a>
                  <Link to={demoUrl} className="btn-ghost gap-2">
                    <QrCode className="h-4 w-4" />
                    Try Demo
                  </Link>
                </motion.div>
              </div>

              <LiveMonitoringCard />
            </div>
          </motion.div>
        </section>

        {/* Stats strip */}
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <Reveal key={stat.label} delay={index * 0.08}>
              <GlassCard hover className="relative overflow-hidden p-6">
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-mid/30 blur-2xl" />
                <p className="text-lg font-bold text-light">
                  <Counter value={stat.value} decimals={stat.decimals ?? 0} />
                  <span className="text-gradient font-bold">{stat.suffix}</span>
                </p>
                <p className="mt-1 text-xs text-muted">{stat.label}</p>
              </GlassCard>
            </Reveal>
          ))}
        </section>

        {/* Overview */}
        <section id="overview" className="space-y-6">
          <Reveal>
            <h2 className="text-2xl font-semibold text-[#ccd0cf]">Overview</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2">
            <Reveal delay={0.1}>
              <GlassCard hover className="h-full p-8">
                <h3 className="text-base font-semibold text-[#ccd0cf]">The Problem</h3>
                <p className="mt-3 leading-relaxed text-muted">
                  Large public events such as concerts, festivals, and college gatherings face recurring safety risks — including
                  harassment incidents and delayed reporting — that escalate when nobody notices them forming.
                </p>
              </GlassCard>
            </Reveal>
            <Reveal delay={0.2}>
              <GlassCard hover className="h-full p-8">
                <h3 className="text-base font-semibold text-[#ccd0cf]">The GeoWatch Solution</h3>
                <p className="mt-3 leading-relaxed text-muted">
                  Participants report incidents through a mobile app while the backend analyzes reports with geospatial clustering —
                  turning scattered signals into early-warning danger zones on a live admin dashboard.
                </p>
              </GlassCard>
            </Reveal>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="space-y-6">
          <Reveal>
            <h2 className="text-2xl font-semibold text-[#ccd0cf]">How It Works</h2>
          </Reveal>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {howItWorksSteps.map((step, index) => (
              <Reveal key={step} delay={index * 0.12}>
                <GlassCard hover className="h-full p-6">
                  <p className="text-sm font-semibold text-gradient">Step {index + 1}</p>
                  <p className="mt-3 leading-relaxed text-light">{step}</p>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="space-y-6">
          <Reveal>
            <h2 className="text-2xl font-semibold text-[#ccd0cf]">Features</h2>
          </Reveal>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  custom={index}
                  viewport={{ once: true, margin: '-60px' }}
                >
                  <GlassCard hover className="group h-full p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-deep text-muted ring-1 ring-mid/60 shadow-[0_0_16px_rgba(74,92,106,0.3)] transition group-hover:bg-mid group-hover:text-[#ccd0cf] group-hover:shadow-[0_0_24px_rgba(74,92,106,0.5)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-[#ccd0cf]">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{feature.description}</p>
                  </GlassCard>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Download */}
        <section id="download" className="space-y-6">
          <Reveal>
            <GlassCard className="glass-hover grid gap-8 rounded-[28px] p-8 md:grid-cols-[1.2fr_auto] md:items-center md:p-10">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-[#ccd0cf]">Download the Mobile App</h2>
                <p className="max-w-2xl leading-relaxed text-muted">
                  Users can download the Android mobile app to report incidents instantly during events and help build real-time
                  crowd safety awareness.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a href={apkUrl} className="btn-primary gap-2">
                    <Download className="h-4 w-4" />
                    Download APK
                  </a>
                  <Link to={demoUrl} className="btn-ghost gap-2">
                    <QrCode className="h-4 w-4" />
                    Scan Demo
                  </Link>
                </div>
              </div>

              <Reveal direction="right" className="justify-self-center">
                <div className="rounded-2xl border border-mid/40 bg-deep/60 p-4 backdrop-blur-xl">
                  <div className="rounded-xl border border-mid/40 bg-deepest/70 p-3">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=geowatch-demo"
                      alt="GeoWatch demo QR code"
                      width={170}
                      height={170}
                      className="rounded-lg"
                    />
                  </div>
                  <p className="mt-3 text-center text-xs text-muted">Scan to open the live demo</p>
                </div>
              </Reveal>
            </GlassCard>
          </Reveal>
        </section>

        {/* Sign up CTA */}
        <Reveal>
          <div className="gradient-border relative overflow-hidden rounded-[28px] p-10 md:p-14">
            <div className="animate-blob pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-deep/90 blur-3xl" />
            <div className="animate-blob pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-mid/40 blur-3xl" style={{ animationDelay: '-5s' }} />
            <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-xl space-y-3">
                <h2 className="text-2xl font-semibold text-[#ccd0cf]">Ready to monitor your event?</h2>
                <p className="text-muted">Create an account or sign in to start organizing events and watching live risk zones.</p>
              </div>
              <Link to="/signup" className="btn-primary gap-2 whitespace-nowrap">
                Sign Up
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Reveal>

        <footer className="glass-dark rounded-[28px] p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <p className="flex items-center gap-2 text-lg font-bold text-[#ccd0cf]">
                <Users className="h-5 w-5 text-muted" />
                GeoWatch
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">Real-time crowd safety intelligence for large public events.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-light">Product</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>
                  <a className="transition hover:text-[#ccd0cf]" href="#overview">
                    Overview
                  </a>
                </li>
                <li>
                  <a className="transition hover:text-[#ccd0cf]" href="#how-it-works">
                    How It Works
                  </a>
                </li>
                <li>
                  <a className="transition hover:text-[#ccd0cf]" href="#features">
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-light">Support</p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                <a className="transition hover:text-[#ccd0cf]" href="mailto:geowatch.support@email.com">
                  geowatch.support@email.com
                </a>
              </p>
              <p className="mt-4 text-sm text-muted/80">© 2026 GeoWatch — Crowd Safety Intelligence System</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default Home
