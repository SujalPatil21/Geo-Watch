import { MessageSquare, Phone, Radar } from 'lucide-react'
import type { Cluster } from '../../types/cluster'
import RiskBadge from './RiskBadge'

const timelineSteps = ['Reported', 'Validated', 'Clustered', 'Resolved']
const activeStep = 2

interface ActiveIncidentCardProps {
  cluster: Cluster
  eventName: string
}

function ActiveIncidentCard({ cluster, eventName }: ActiveIncidentCardProps) {
  const reporter = cluster.incidents[0]?.name ?? 'Unknown Reporter'

  const fields = [
    { label: 'Cluster ID', value: `CL-${(cluster.centerLat.toFixed(4) + cluster.centerLng.toFixed(4)).replace('.', '').slice(-5)}` },
    { label: 'Reporter', value: reporter },
    { label: 'Incident Count', value: String(cluster.incidentCount) },
    { label: 'Radius', value: `${Math.max(30, cluster.incidentCount * 6)}m` },
  ]

  return (
    <section className="relative overflow-hidden rounded-2xl border border-mid/40 bg-deep/60 p-[18px] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tl from-mid/25 via-transparent to-transparent" />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[#ccd0cf]">Active Risk Zone</h2>
            <p className="mt-0.5 text-xs text-muted">{eventName}</p>
          </div>
          <RiskBadge level={cluster.riskLevel} />
        </div>

        {/* Timeline */}
        <div className="flex items-center">
          {timelineSteps.map((step, index) => (
            <div key={step} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-bold ${
                    index <= activeStep
                      ? 'border-mid bg-deep text-[#ccd0cf] shadow-[0_0_10px_rgba(154,168,171,0.35)]'
                      : 'border-mid/40 bg-deep/50 text-muted'
                  }`}
                >
                  {index + 1}
                </span>
                <span className={`text-[9px] font-medium ${index <= activeStep ? 'text-light' : 'text-muted'}`}>
                  {step}
                </span>
              </div>
              {index < timelineSteps.length - 1 && (
                <div className={`mx-1 h-px flex-1 ${index < activeStep ? 'bg-mid/70' : 'bg-mid/30'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          {fields.map((field) => (
            <div key={field.label}>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted">{field.label}</p>
              <p className="mt-0.5 truncate text-sm font-medium text-[#ccd0cf]">{field.value}</p>
            </div>
          ))}

          <div className="col-span-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted">Description</p>
            <p className="mt-0.5 text-sm text-muted">SOS report cluster detected in the monitored zone.</p>
          </div>
        </div>

        {/* Assigned responder */}
        <div className="flex items-center justify-between rounded-xl border border-mid/40 bg-deep/50 p-3 backdrop-blur">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mid text-sm font-bold text-[#06141b] ring-1 ring-light/40">
              ET
            </span>
            <div>
              <p className="text-sm font-semibold text-[#ccd0cf]">Event Team</p>
              <p className="flex items-center gap-1 text-[10px] text-muted">
                <Radar className="h-3 w-3" />
                Assigned responder
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              title="Call"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-deep text-[#ccd0cf] ring-1 ring-mid transition hover:ring-light/60"
            >
              <Phone className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              title="Message"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-deep text-[#ccd0cf] ring-1 ring-mid transition hover:ring-light/60"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ActiveIncidentCard