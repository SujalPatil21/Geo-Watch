import type { Cluster } from '../../types/cluster'
import type { Event } from '../../types/event'
import RiskBadge from './RiskBadge'

const clusterIconColor: Record<string, string> = {
  HIGH: 'bg-rose-500/25 text-rose-300 ring-rose-400/50',
  MEDIUM: 'bg-amber-500/20 text-amber-300 ring-amber-400/40',
  LOW: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
}

interface IncidentListProps {
  clusters: Cluster[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  eventData: Event
}

function IncidentList({ clusters, selectedIndex, onSelect, eventData }: IncidentListProps) {
  return (
    <section className="rounded-2xl border border-mid/40 bg-deep/60 p-[18px] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#ccd0cf]">Incident Clusters</h2>
        <span className="rounded-md border border-mid/40 bg-deep/50 px-2 py-0.5 text-[10px] font-medium text-muted">
          {clusters.length} active
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        {clusters.length === 0 && (
          <p className="rounded-lg border border-dashed border-mid/40 px-3 py-6 text-center text-xs text-muted">
            No clusters yet — wait for SOS reports from the mobile app.
          </p>
        )}

        {clusters.map((cluster, index) => {
          const selected = selectedIndex === index
          return (
            <button
              key={`${cluster.centerLat}-${cluster.centerLng}-${index}`}
              type="button"
              onClick={() => onSelect(index)}
              className={`flex h-11 w-full items-center gap-3 rounded-[10px] border px-2.5 text-left transition ${
                selected
                  ? 'border-light/50 bg-deep shadow-[0_0_14px_rgba(74,92,106,0.35)]'
                  : 'border-mid/40 bg-deep/40 hover:border-mid hover:bg-deep/70'
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-bold ring-1 ${clusterIconColor[cluster.riskLevel]}`}
              >
                {cluster.incidentCount}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-[#ccd0cf]">
                  CL-{(cluster.centerLat.toFixed(4) + cluster.centerLng.toFixed(4)).replace('.', '').slice(-5)}
                </span>
                <span className="block truncate text-[10px] text-muted">{eventData.name}</span>
              </span>
              <RiskBadge level={cluster.riskLevel} />
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default IncidentList