import type { RiskLevel } from '../../types/cluster'

const styles: Record<RiskLevel, string> = {
  HIGH: 'border-rose-400/60 bg-rose-500/25 text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.4)]',
  MEDIUM: 'border-amber-400/50 bg-amber-500/20 text-amber-200',
  LOW: 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200',
}

interface RiskBadgeProps {
  level: RiskLevel
  className?: string
}

function RiskBadge({ level, className = '' }: RiskBadgeProps) {
  const pulseDot =
    level === 'HIGH' ? (
      <span className="relative flex h-1.5 w-1.5">
        <span className="risk-pulse-ring absolute inline-flex h-full w-full rounded-full bg-rose-400/90" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-400" />
      </span>
    ) : null

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[level]} ${className}`}
    >
      {pulseDot}
      {level}
    </span>
  )
}

export default RiskBadge