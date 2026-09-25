import L from 'leaflet'
import type { RiskLevel } from '../types/cluster'

const riskColors: Record<RiskLevel, string> = {
  HIGH: '#f87171',
  MEDIUM: '#fb923c',
  LOW: '#facc15',
}

const riskLabels: Record<RiskLevel, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
}

export function createClusterIcon(riskLevel: RiskLevel, count: number) {
  const color = riskColors[riskLevel]
  const pulseRing =
    riskLevel === 'HIGH'
      ? '<span class="ring"></span><span class="ring" style="animation-delay:-0.8s"></span>'
      : ''
  const label = riskLabels[riskLevel]

  return L.divIcon({
    className: 'geowatch-cluster-wrap',
    html: `
      <div class="geowatch-cluster" style="--c:${color}" title="${label} risk — ${count} report(s)">
        ${pulseRing}
        <span class="dot"></span>
        <span class="count">${count}</span>
      </div>
    `,
    iconSize: [48, 28],
    iconAnchor: [24, 14],
    popupAnchor: [0, -14],
  })
}

export const cyanPinIcon = L.divIcon({
  className: '',
  html: `
    <svg width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 6px 10px rgba(0,0,0,.45))">
      <defs>
        <linearGradient id="pinGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#67e8f9"/>
          <stop offset="100%" stop-color="#0891b2"/>
        </linearGradient>
      </defs>
      <path d="M15 0C6.7 0 0 6.7 0 15c0 11.25 15 27 15 27s15-15.75 15-27C30 6.7 23.3 0 15 0z" fill="url(#pinGrad)"/>
      <circle cx="15" cy="15" r="6.5" fill="#082f49"/>
      <circle cx="15" cy="15" r="3" fill="#22d3ee"/>
    </svg>
  `,
  iconSize: [30, 42],
  iconAnchor: [15, 42],
  popupAnchor: [0, -34],
})