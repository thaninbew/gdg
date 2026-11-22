// Demo time series for the operations dashboard. The dataset has no timestamps, so every series
// here is mock data and the panels that use it show a "Mock" badge. Replace with API metrics.
import { volumeByHour } from "@/lib/mock"

export type Range = "1h" | "24h" | "7d"
export type VolumePoint = { t: string; high: number; medium: number; low: number }

const minutes = Array.from({ length: 12 }, (_, i) => {
  const burst = i >= 2 && i <= 5 ? 6 - Math.abs(3.5 - i) * 2 : 0
  return {
    t: `09:${String(i * 5).padStart(2, "0")}`,
    high: Math.round(1 + burst),
    medium: 2 + ((i * 3) % 3),
    low: 1 + ((i * 5) % 3),
  }
})

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((t, i) => ({
  t,
  high: [22, 18, 25, 61, 24, 9, 7][i],
  medium: [148, 152, 160, 171, 149, 52, 41][i],
  low: [121, 118, 126, 130, 119, 44, 38][i],
}))

export const VOLUME: Record<Range, { points: VolumePoint[]; burst: [string, string] | null }> = {
  "1h": { points: minutes, burst: ["09:10", "09:25"] },
  "24h": { points: volumeByHour.map((p) => ({ t: p.hour, high: p.high, medium: p.medium, low: p.low })), burst: ["08:00", "10:00"] },
  "7d": { points: days, burst: ["Thu", "Thu"] },
}

/** Last 12 readings per summary card, oldest first. */
export const KPI_TRENDS = {
  open: [11, 12, 10, 13, 15, 14, 12, 11, 9, 10, 9, 8],
  escalation: [0.28, 0.3, 0.31, 0.29, 0.34, 0.38, 0.41, 0.44, 0.42, 0.4, 0.41, 0.4],
  clarify: [2, 3, 2, 2, 4, 5, 5, 4, 3, 4, 5, 4],
  drafts: [4, 3, 5, 4, 3, 2, 3, 3, 2, 3, 2, 2],
}
