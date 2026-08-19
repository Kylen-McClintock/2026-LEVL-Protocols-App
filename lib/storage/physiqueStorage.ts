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

/**
 * Compresses and downscales raw high-res smartphone/camera images to an optimized size
 * (e.g. 10MB -> ~120KB) to ensure lightning-fast UI rendering and unlimited storage headroom.
 */
export async function compressPhysiqueImage(file: File, maxDimension = 1200, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return resolve(e.target?.result as string)
        }

        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      img.onerror = () => resolve(e.target?.result as string)
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
