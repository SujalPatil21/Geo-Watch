export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Incident {
  name: string
  phoneNumber: string
}

export interface Cluster {
  centerLat: number
  centerLng: number
  incidentCount: number
  riskLevel: RiskLevel
  incidents: Incident[]
}
