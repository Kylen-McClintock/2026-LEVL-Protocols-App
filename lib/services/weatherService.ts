export interface LocalWeatherData {
  temp_f: number
  temp_c: number
  humidity: number
  pressure_hpa: number
  pressure_trend?: 'rising' | 'falling' | 'stable'
  uv_index: number
  weather_code: number
  condition: string
  icon: string
  city?: string
  fetched_at: string
}

function getWeatherConditionDetails(code: number): { condition: string; icon: string } {
  if (code === 0) return { condition: 'Clear Sky', icon: '☀️' }
  if (code === 1) return { condition: 'Mainly Clear', icon: '🌤️' }
  if (code === 2) return { condition: 'Partly Cloudy', icon: '⛅' }
  if (code === 3) return { condition: 'Overcast', icon: '☁️' }
  if (code === 45 || code === 48) return { condition: 'Foggy', icon: '🌫️' }
  if (code >= 51 && code <= 55) return { condition: 'Drizzle', icon: '🌦️' }
  if (code >= 61 && code <= 65) return { condition: 'Rain', icon: '🌧️' }
  if (code >= 71 && code <= 77) return { condition: 'Snow', icon: '❄️' }
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: '🌦️' }
  if (code >= 95) return { condition: 'Thunderstorm', icon: '⛈️' }
  return { condition: 'Fair', icon: '🌤️' }
}

const WEATHER_CACHE_KEY = 'levl_cached_weather'
const CACHE_TTL_MS = 1000 * 60 * 60 // 1 hour

export function getCachedWeather(): LocalWeatherData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - new Date(parsed.fetched_at).getTime() < CACHE_TTL_MS) {
      return parsed
    }
  } catch (e) {
    console.warn('Notice reading weather cache:', e)
  }
  return null
}

export async function fetchCurrentWeather(forceRefresh = false): Promise<LocalWeatherData | null> {
  if (typeof window === 'undefined') return null

  if (!forceRefresh) {
    const cached = getCachedWeather()
    if (cached) return cached
  }

  try {
    let lat: number | null = null
    let lon: number | null = null
    let city = ''

    // 1. Try browser geolocation
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 60000
          })
        })
        lat = position.coords.latitude
        lon = position.coords.longitude
      } catch {
        // Geolocation denied or timed out, will fallback to IP
      }
    }

    // 2. Fallback to IP lookup if browser coords unavailable
    if (lat === null || lon === null) {
      try {
        const ipRes = await fetch('https://ipapi.co/json/', { cache: 'no-store' })
        if (ipRes.ok) {
          const ipData = await ipRes.json()
          lat = ipData.latitude
          lon = ipData.longitude
          city = ipData.city || ''
        }
      } catch {
        // IP lookup fallback failed
      }
    }

    // If still no coords, default to standard temperate baseline
    if (lat === null || lon === null) {
      lat = 40.7128 // NYC fallback
      lon = -74.0060
      city = 'Estimated Location'
    }

    // 3. Query Open-Meteo free API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,weather_code,uv_index&temperature_unit=fahrenheit&wind_speed_unit=mph`
    const res = await fetch(weatherUrl)
    if (!res.ok) return null

    const data = await res.json()
    const current = data.current
    if (!current) return null

    const weatherCode = current.weather_code ?? 0
    const { condition, icon } = getWeatherConditionDetails(weatherCode)
    const tempF = Math.round(current.temperature_2m ?? 70)
    const tempC = Math.round(((tempF - 32) * 5) / 9)
    const humidity = Math.round(current.relative_humidity_2m ?? 50)
    const pressureHpa = Math.round(current.surface_pressure ?? 1013)
    const uvIndex = current.uv_index ?? 0

    const weatherData: LocalWeatherData = {
      temp_f: tempF,
      temp_c: tempC,
      humidity,
      pressure_hpa: pressureHpa,
      pressure_trend: pressureHpa < 1008 ? 'falling' : pressureHpa > 1018 ? 'rising' : 'stable',
      uv_index: uvIndex,
      weather_code: weatherCode,
      condition,
      icon,
      city,
      fetched_at: new Date().toISOString()
    }

    try {
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherData))
      window.dispatchEvent(new CustomEvent('levl_weather_updated', { detail: weatherData }))
    } catch {}

    return weatherData
  } catch (err) {
    console.warn('Notice fetching current weather:', err)
    return null
  }
}
