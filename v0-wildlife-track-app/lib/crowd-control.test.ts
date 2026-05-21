import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  findSightingsInRadius,
  checkCrowdAlert,
  findCrowdHotspots,
  generateCrowdAlertMessage,
} from './crowd-control'
import type { Sighting, CrowdSettings } from './types'

// Helper to create mock sightings
function createMockSighting(
  id: string,
  latitude: number,
  longitude: number
): Sighting {
  return {
    id,
    user_id: 'user-1',
    animal_type_id: 'animal-1',
    latitude,
    longitude,
    description: null,
    created_at: new Date().toISOString(),
  }
}

const defaultSettings: CrowdSettings = {
  id: 'settings-1',
  threshold: 3,
  radius_meters: 100,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('calculateDistance', () => {
  it('should return 0 for same coordinates', () => {
    const distance = calculateDistance(-8.0476, -34.877, -8.0476, -34.877)
    expect(distance).toBe(0)
  })

  it('should calculate distance between two points', () => {
    // Recife to Olinda (~7km)
    const distance = calculateDistance(-8.0476, -34.877, -8.009, -34.851)
    expect(distance).toBeGreaterThan(4000)
    expect(distance).toBeLessThan(8000)
  })

  it('should handle cross-equator distances', () => {
    const distance = calculateDistance(1, 0, -1, 0)
    // ~222km
    expect(distance).toBeGreaterThan(220000)
    expect(distance).toBeLessThan(225000)
  })

  it('should be symmetric', () => {
    const d1 = calculateDistance(-8.0476, -34.877, -8.009, -34.851)
    const d2 = calculateDistance(-8.009, -34.851, -8.0476, -34.877)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001)
  })
})

describe('findSightingsInRadius', () => {
  const centerLat = -8.0476
  const centerLng = -34.877

  it('should return empty array for no sightings', () => {
    const result = findSightingsInRadius([], centerLat, centerLng, 100)
    expect(result).toEqual([])
  })

  it('should find sightings within radius', () => {
    const sightings = [
      createMockSighting('1', centerLat + 0.0001, centerLng), // ~11m away
      createMockSighting('2', centerLat + 0.001, centerLng), // ~111m away
      createMockSighting('3', centerLat + 0.01, centerLng), // ~1.1km away
    ]

    const result = findSightingsInRadius(sightings, centerLat, centerLng, 100)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })

  it('should include sightings at exact radius', () => {
    const sightings = [
      createMockSighting('1', centerLat, centerLng), // 0m away
    ]

    const result = findSightingsInRadius(sightings, centerLat, centerLng, 0)
    expect(result).toHaveLength(1)
  })

  it('should find all sightings within large radius', () => {
    const sightings = [
      createMockSighting('1', centerLat + 0.0001, centerLng),
      createMockSighting('2', centerLat + 0.001, centerLng),
      createMockSighting('3', centerLat + 0.005, centerLng),
    ]

    const result = findSightingsInRadius(sightings, centerLat, centerLng, 1000)
    expect(result).toHaveLength(3)
  })
})

describe('checkCrowdAlert', () => {
  const centerLat = -8.0476
  const centerLng = -34.877

  it('should not trigger alert below threshold', () => {
    const sightings = [
      createMockSighting('1', centerLat + 0.0001, centerLng),
      createMockSighting('2', centerLat + 0.0002, centerLng),
    ]

    const result = checkCrowdAlert(sightings, centerLat, centerLng, defaultSettings)
    expect(result.alert).toBe(false)
    expect(result.count).toBe(2)
  })

  it('should trigger alert at threshold', () => {
    const sightings = [
      createMockSighting('1', centerLat + 0.0001, centerLng),
      createMockSighting('2', centerLat + 0.0002, centerLng),
      createMockSighting('3', centerLat + 0.0003, centerLng),
    ]

    const result = checkCrowdAlert(sightings, centerLat, centerLng, defaultSettings)
    expect(result.alert).toBe(true)
    expect(result.count).toBe(3)
  })

  it('should trigger alert above threshold', () => {
    const sightings = [
      createMockSighting('1', centerLat + 0.0001, centerLng),
      createMockSighting('2', centerLat + 0.0002, centerLng),
      createMockSighting('3', centerLat + 0.0003, centerLng),
      createMockSighting('4', centerLat + 0.0004, centerLng),
      createMockSighting('5', centerLat + 0.0005, centerLng),
    ]

    const result = checkCrowdAlert(sightings, centerLat, centerLng, defaultSettings)
    expect(result.alert).toBe(true)
    expect(result.count).toBe(5)
  })

  it('should respect custom settings', () => {
    const sightings = [
      createMockSighting('1', centerLat + 0.0001, centerLng),
      createMockSighting('2', centerLat + 0.001, centerLng), // Outside 50m radius
    ]

    const customSettings: CrowdSettings = {
      ...defaultSettings,
      threshold: 1,
      radius_meters: 50,
    }

    const result = checkCrowdAlert(sightings, centerLat, centerLng, customSettings)
    expect(result.alert).toBe(true)
    expect(result.count).toBe(1)
  })
})

describe('findCrowdHotspots', () => {
  it('should return empty array for no sightings', () => {
    const result = findCrowdHotspots([], defaultSettings)
    expect(result).toEqual([])
  })

  it('should return empty array when no hotspots exist', () => {
    const sightings = [
      createMockSighting('1', -8.0476, -34.877),
      createMockSighting('2', -8.1, -34.9), // Far away
    ]

    const result = findCrowdHotspots(sightings, defaultSettings)
    expect(result).toEqual([])
  })

  it('should find hotspots when threshold is met', () => {
    const centerLat = -8.0476
    const centerLng = -34.877

    const sightings = [
      createMockSighting('1', centerLat, centerLng),
      createMockSighting('2', centerLat + 0.0001, centerLng),
      createMockSighting('3', centerLat + 0.0002, centerLng),
    ]

    const result = findCrowdHotspots(sightings, defaultSettings)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].count).toBeGreaterThanOrEqual(3)
  })

  it('should sort hotspots by count descending', () => {
    const settings: CrowdSettings = {
      ...defaultSettings,
      threshold: 2,
    }

    const sightings = [
      // Cluster 1: 2 sightings
      createMockSighting('1', -8.0476, -34.877),
      createMockSighting('2', -8.0477, -34.877),
      // Cluster 2: 3 sightings (should be first)
      createMockSighting('3', -8.1, -34.9),
      createMockSighting('4', -8.1001, -34.9),
      createMockSighting('5', -8.1002, -34.9),
    ]

    const result = findCrowdHotspots(sightings, settings)
    expect(result.length).toBe(2)
    expect(result[0].count).toBeGreaterThanOrEqual(result[1].count)
  })
})

describe('generateCrowdAlertMessage', () => {
  it('should generate tranquil message below threshold', () => {
    const message = generateCrowdAlertMessage(2, 5)
    expect(message).toContain('Área tranquila')
    expect(message).toContain('2 avistamentos')
  })

  it('should generate warning message at threshold', () => {
    const message = generateCrowdAlertMessage(5, 5)
    expect(message).toContain('Alerta de aglomeração')
    expect(message).toContain('5 avistamentos')
  })

  it('should generate critical message at double threshold', () => {
    const message = generateCrowdAlertMessage(10, 5)
    expect(message).toContain('Alerta crítico')
    expect(message).toContain('10 avistamentos')
  })

  it('should generate warning message between threshold and double', () => {
    const message = generateCrowdAlertMessage(7, 5)
    expect(message).toContain('Alerta de aglomeração')
  })
})
