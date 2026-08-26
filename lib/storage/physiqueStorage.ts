export interface PostureAssessment {
  forward_head: 'none' | 'mild' | 'moderate' | 'pronounced'
  rounded_shoulders: 'none' | 'mild' | 'moderate' | 'pronounced'
  pelvic_tilt: 'neutral' | 'mild_anterior' | 'anterior' | 'posterior'
  bilateral_asymmetry?: string
  summary: string
  corrective_cues?: string[]
}

export interface PhysiqueAnalysisResult {
  body_fat_pct: number
  body_fat_ci: { min: number; max: number }
  estimated_weight_lbs?: number
  weight_ci?: { min: number; max: number }
  skeletal_muscle_mass_pct?: number
  visceral_fat_grade: number // 1 to 10
  ffmi?: number
  v_taper_ratio?: number
  waist_to_hip_ratio?: number
  posture_assessment: PostureAssessment
  fluid_retention_level: 'dry_lean' | 'normal' | 'mild_watery' | 'moderate_watery'
  anatomical_landmarks_detected: string[]
  confidence_score: number
  confidence_tier: 'high' | 'moderate' | 'low'
  key_observations: string[]
  recommendation: string
}

export interface BodyCompositionRecord {
  id: string
  date: string
  weight_lbs?: number
  skeletal_muscle_mass_pct?: number
  body_fat_pct?: number
  visceral_fat_grade?: number
  photo_url?: string
  photo_pose?: 'front' | 'side' | 'back' | 'flexed' | 'general'
  notes?: string
  // Extended AI Vision Fields
  ai_estimated?: boolean
  confidence_score?: number
  body_fat_ci?: { min: number; max: number }
  weight_ci?: { min: number; max: number }
  ffmi?: number
  v_taper_ratio?: number
  waist_to_hip_ratio?: number
  posture_assessment?: PostureAssessment
  fluid_retention_level?: 'dry_lean' | 'normal' | 'mild_watery' | 'moderate_watery'
  analysis_result?: PhysiqueAnalysisResult
}

const DB_NAME = 'levl_physique_db'
const STORE_NAME = 'physique_records'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'))
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

import { compressAndDownscaleImage } from '@/lib/utils/imageCompression'

/**
 * Compresses and downscales raw high-res smartphone/camera images to an optimized size
 * (e.g. 10MB -> ~120KB) to ensure lightning-fast UI rendering and unlimited storage headroom.
 */
export async function compressPhysiqueImage(file: File | Blob | string, maxDimension = 1200, quality = 0.80): Promise<string> {
  return compressAndDownscaleImage(file, { maxDimension, quality })
}

/**
 * Calls the AI Vision endpoint to analyze physique, estimate BF% with CI, posture, and body metrics.
 */
export async function analyzePhysiquePhoto(
  fileOrBase64: File | Blob | string,
  userContext?: {
    knownWeightLbs?: number | null
    heightInches?: number | null
    sex?: 'male' | 'female'
    age?: number | null
    pose?: string
  }
): Promise<PhysiqueAnalysisResult> {
  // 1. Ensure client-side compression
  const compressedBase64 = await compressAndDownscaleImage(fileOrBase64, {
    maxDimension: 1200,
    quality: 0.82
  })

  // 2. Transmit to serverless vision route
  const formData = new FormData()
  formData.append('image', compressedBase64)
  if (userContext?.knownWeightLbs) formData.append('known_weight_lbs', userContext.knownWeightLbs.toString())
  if (userContext?.heightInches) formData.append('height_inches', userContext.heightInches.toString())
  if (userContext?.sex) formData.append('sex', userContext.sex)
  if (userContext?.age) formData.append('age', userContext.age.toString())
  if (userContext?.pose) formData.append('pose', userContext.pose)

  const res = await fetch('/api/physique/analyze', {
    method: 'POST',
    body: formData
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to analyze physique photo.')
  }

  const json = await res.json()
  return json.data as PhysiqueAnalysisResult
}

/**
 * Loads all body composition and physique photo records from IndexedDB with localStorage fallback
 */
export async function loadPhysiqueRecords(): Promise<BodyCompositionRecord[]> {
  if (typeof window === 'undefined') return []

  try {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.getAll()

      req.onsuccess = () => {
        const records = (req.result || []) as BodyCompositionRecord[]
        // Sort descending by date
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        resolve(records)
      }
      req.onerror = () => {
        // Fallback to localStorage if IDB fails
        resolve(getLocalStorageFallback())
      }
    })
  } catch (err) {
    return getLocalStorageFallback()
  }
}

/**
 * Saves or updates a physique record in IndexedDB
 */
export async function savePhysiqueRecordToDB(record: BodyCompositionRecord): Promise<BodyCompositionRecord[]> {
  if (typeof window === 'undefined') return []

  try {
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(record)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
    return await loadPhysiqueRecords()
  } catch (err) {
    console.error('Error saving physique record to IndexedDB, using fallback:', err)
    return saveToLocalStorageFallback(record)
  }
}

function getLocalStorageFallback(): BodyCompositionRecord[] {
  try {
    const raw = localStorage.getItem('levl_body_composition_records')
    if (raw) return JSON.parse(raw)
  } catch (e) {
    // Ignore quota errors
  }
  return []
}

function saveToLocalStorageFallback(record: BodyCompositionRecord): BodyCompositionRecord[] {
  try {
    const existing = getLocalStorageFallback()
    // Strip heavy photo from localStorage fallback to prevent quota exception
    const lightweightRecord = { ...record }
    if (lightweightRecord.photo_url && lightweightRecord.photo_url.length > 50000) {
      delete lightweightRecord.photo_url
    }
    const updated = [lightweightRecord, ...existing.filter(r => r.id !== record.id)]
    localStorage.setItem('levl_body_composition_records', JSON.stringify(updated))
    return [record, ...existing.filter(r => r.id !== record.id)]
  } catch (e) {
    console.warn('LocalStorage quota fallback reached:', e)
    return [record]
  }
}
