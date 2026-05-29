import { describe, it, expect } from 'vitest'
import type { Sighting } from '../types'
import { CROWD_THRESHOLD } from '../types'

// Haversine distance calculation (same as used in components)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function countNearbySightings(
  sighting: Sighting,
  allSightings: Sighting[],
  radiusKm: number = 0.5
): number {
  let count = 0

  for (const other of allSightings) {
    if (other.id === sighting.id) continue
    if (other.animal_type !== sighting.animal_type) continue

    const distance = calculateDistance(
      sighting.latitude,
      sighting.longitude,
      other.latitude,
      other.longitude
    )

    if (distance <= radiusKm) {
      count++
    }
  }

  return count
}

function isCrowded(sighting: Sighting, allSightings: Sighting[]): boolean {
  return countNearbySightings(sighting, allSightings) >= CROWD_THRESHOLD
}

describe('Distance Calculation', () => {
  it('should calculate distance between two points correctly', () => {
    // Recife coordinates
    const lat1 = -8.0476
    const lng1 = -34.877

    // Same point should be 0 distance
    expect(calculateDistance(lat1, lng1, lat1, lng1)).toBeCloseTo(0, 5)

    // Point approximately 1km away (rough calculation)
    // 0.01 degree latitude ≈ 1.11 km
    const lat2 = lat1 + 0.009
    const distance = calculateDistance(lat1, lng1, lat2, lng1)
    expect(distance).toBeGreaterThan(0.9)
    expect(distance).toBeLessThan(1.2)
  })

  it('should handle large distances', () => {
    // New York to Los Angeles ≈ 3940 km
    const nyLat = 40.7128
    const nyLng = -74.006
    const laLat = 34.0522
    const laLng = -118.2437

    const distance = calculateDistance(nyLat, nyLng, laLat, laLng)
    expect(distance).toBeGreaterThan(3500)
    expect(distance).toBeLessThan(4500)
  })
})

describe('Crowd Control', () => {
  const baseSighting: Sighting = {
    id: 'test-1',
    user_id: 'user-1',
    animal_type: 'Onça-pintada',
    latitude: -8.0476,
    longitude: -34.877,
    created_at: new Date().toISOString(),
  }

  it('should count nearby sightings of same animal type', () => {
    const sightings: Sighting[] = [
      baseSighting,
      {
        ...baseSighting,
        id: 'test-2',
        latitude: -8.0477, // Very close
      },
      {
        ...baseSighting,
        id: 'test-3',
        latitude: -8.0478, // Very close
      },
    ]

    const count = countNearbySightings(baseSighting, sightings)
    expect(count).toBe(2)
  })

  it('should not count sightings of different animal types', () => {
    const sightings: Sighting[] = [
      baseSighting,
      {
        ...baseSighting,
        id: 'test-2',
        animal_type: 'Capivara', // Different animal
        latitude: -8.0477,
      },
    ]

    const count = countNearbySightings(baseSighting, sightings)
    expect(count).toBe(0)
  })

  it('should not count sightings outside radius', () => {
    const sightings: Sighting[] = [
      baseSighting,
      {
        ...baseSighting,
        id: 'test-2',
        latitude: -8.1, // More than 0.5km away
      },
    ]

    const count = countNearbySightings(baseSighting, sightings)
    expect(count).toBe(0)
  })

  it('should not count itself', () => {
    const sightings: Sighting[] = [baseSighting]
    const count = countNearbySightings(baseSighting, sightings)
    expect(count).toBe(0)
  })

  it('should detect crowded locations', () => {
    // Create CROWD_THRESHOLD + 1 sightings in same location
    const sightings: Sighting[] = Array.from({ length: CROWD_THRESHOLD + 1 }, (_, i) => ({
      ...baseSighting,
      id: `test-${i}`,
      latitude: baseSighting.latitude + i * 0.0001, // Small variations
    }))

    expect(isCrowded(sightings[0], sightings)).toBe(true)
  })

  it('should not flag non-crowded locations', () => {
    // Create less than CROWD_THRESHOLD sightings
    const sightings: Sighting[] = Array.from({ length: CROWD_THRESHOLD - 1 }, (_, i) => ({
      ...baseSighting,
      id: `test-${i}`,
      latitude: baseSighting.latitude + i * 0.0001,
    }))

    expect(isCrowded(sightings[0], sightings)).toBe(false)
  })
})

describe('CROWD_THRESHOLD constant', () => {
  it('should be set to 10', () => {
    expect(CROWD_THRESHOLD).toBe(10)
  })
})
