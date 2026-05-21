import type { Sighting, CrowdSettings } from './types'

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Find sightings within a given radius of a center point
 */
export function findSightingsInRadius(
  sightings: Sighting[],
  centerLat: number,
  centerLng: number,
  radiusMeters: number
): Sighting[] {
  return sightings.filter((sighting) => {
    const distance = calculateDistance(
      centerLat,
      centerLng,
      sighting.latitude,
      sighting.longitude
    )
    return distance <= radiusMeters
  })
}

/**
 * Check if a location has crowd alert based on settings
 */
export function checkCrowdAlert(
  sightings: Sighting[],
  centerLat: number,
  centerLng: number,
  settings: CrowdSettings
): { alert: boolean; count: number } {
  const nearBySightings = findSightingsInRadius(
    sightings,
    centerLat,
    centerLng,
    settings.radius_meters
  )
  
  return {
    alert: nearBySightings.length >= settings.threshold,
    count: nearBySightings.length,
  }
}

/**
 * Find all crowd hotspots in a list of sightings
 */
export function findCrowdHotspots(
  sightings: Sighting[],
  settings: CrowdSettings
): Array<{
  latitude: number
  longitude: number
  count: number
}> {
  const hotspots: Array<{ latitude: number; longitude: number; count: number }> = []
  const visited = new Set<string>()

  for (const sighting of sightings) {
    const key = `${sighting.latitude.toFixed(4)},${sighting.longitude.toFixed(4)}`
    if (visited.has(key)) continue
    visited.add(key)

    const { alert, count } = checkCrowdAlert(
      sightings,
      sighting.latitude,
      sighting.longitude,
      settings
    )

    if (alert) {
      hotspots.push({
        latitude: sighting.latitude,
        longitude: sighting.longitude,
        count,
      })
    }
  }

  return hotspots.sort((a, b) => b.count - a.count)
}

/**
 * Generate crowd alert message
 */
export function generateCrowdAlertMessage(count: number, threshold: number): string {
  if (count >= threshold * 2) {
    return `Alerta crítico: ${count} avistamentos detectados na área. Considere evitar esta região.`
  }
  if (count >= threshold) {
    return `Alerta de aglomeração: ${count} avistamentos na área. Proceda com cautela.`
  }
  return `Área tranquila: ${count} avistamentos recentes.`
}
