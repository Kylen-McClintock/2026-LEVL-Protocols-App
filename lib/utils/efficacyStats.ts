import { EfficacyStat } from '@/lib/types'

/**
 * Safely extracts an array of EfficacyStat objects from a modality or raw efficacy_stats field.
 * Handles:
 * - Direct Array
 * - JSON stringified array or object map
 * - Plain object map (e.g. { "0": {...} } or {})
 * - Null / undefined / primitive values
 */
export function getSafeEfficacyStats(target: any): EfficacyStat[] {
  if (!target) return []

  const raw = target.efficacy_stats !== undefined ? target.efficacy_stats : target
  if (!raw) return []

  if (Array.isArray(raw)) {
    return raw.filter((item: any) => item && typeof item === 'object')
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.filter((item: any) => item && typeof item === 'object')
      }
      if (parsed && typeof parsed === 'object') {
        return Object.values(parsed).filter((item: any) => item && typeof item === 'object') as EfficacyStat[]
      }
    } catch {
      return []
    }
  }

  if (typeof raw === 'object') {
    return Object.values(raw).filter((item: any) => item && typeof item === 'object') as EfficacyStat[]
  }

  return []
}
