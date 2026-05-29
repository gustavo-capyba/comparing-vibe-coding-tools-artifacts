import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  countNearbyUsers,
  shouldSuppressNotifications,
  filterUsersForNotification,
  getCrowdStats,
  type UserLocation,
  type CrowdControlConfig,
} from '../crowd-control'

describe('Crowd Control', () => {
  describe('calculateDistance', () => {
    it('deve calcular distância zero para o mesmo ponto', () => {
      const distance = calculateDistance(-8.0476, -34.877, -8.0476, -34.877)
      expect(distance).toBe(0)
    })

    it('deve calcular distância corretamente entre dois pontos', () => {
      // Recife centro para Boa Viagem (~7km)
      const distance = calculateDistance(
        -8.0539, -34.8811, // Recife Centro
        -8.1200, -34.8950  // Boa Viagem
      )
      expect(distance).toBeGreaterThan(5000)
      expect(distance).toBeLessThan(10000)
    })

    it('deve calcular distâncias curtas com precisão', () => {
      // ~100 metros
      const distance = calculateDistance(
        -8.0476, -34.877,
        -8.0485, -34.877
      )
      expect(distance).toBeGreaterThan(90)
      expect(distance).toBeLessThan(110)
    })
  })

  describe('countNearbyUsers', () => {
    const userLocations: UserLocation[] = [
      { user_id: '1', latitude: -8.0476, longitude: -34.877 },  // Centro
      { user_id: '2', latitude: -8.0478, longitude: -34.878 },  // ~100m
      { user_id: '3', latitude: -8.0480, longitude: -34.879 },  // ~200m
      { user_id: '4', latitude: -8.0500, longitude: -34.880 },  // ~400m
      { user_id: '5', latitude: -8.0600, longitude: -34.890 },  // ~1.5km
    ]

    it('deve contar usuários dentro do raio de 500m', () => {
      const count = countNearbyUsers(-8.0476, -34.877, userLocations, 500)
      expect(count).toBe(4) // 4 usuários estão dentro de 500m
    })

    it('deve contar usuários dentro do raio de 200m', () => {
      const count = countNearbyUsers(-8.0476, -34.877, userLocations, 200)
      expect(count).toBe(2) // 2 usuários estão dentro de 200m
    })

    it('deve contar todos os usuários com raio grande', () => {
      const count = countNearbyUsers(-8.0476, -34.877, userLocations, 5000)
      expect(count).toBe(5)
    })

    it('deve retornar 0 para lista vazia', () => {
      const count = countNearbyUsers(-8.0476, -34.877, [], 500)
      expect(count).toBe(0)
    })
  })

  describe('shouldSuppressNotifications', () => {
    const config: CrowdControlConfig = {
      proximityRadiusMeters: 500,
      maxNearbyUsers: 3,
    }

    it('deve suprimir quando há muitos usuários próximos', () => {
      const userLocations: UserLocation[] = [
        { user_id: '1', latitude: -8.0476, longitude: -34.877 },
        { user_id: '2', latitude: -8.0478, longitude: -34.878 },
        { user_id: '3', latitude: -8.0480, longitude: -34.879 },
      ]
      
      const suppress = shouldSuppressNotifications(
        -8.0476, -34.877,
        userLocations,
        config
      )
      expect(suppress).toBe(true)
    })

    it('não deve suprimir quando há poucos usuários próximos', () => {
      const userLocations: UserLocation[] = [
        { user_id: '1', latitude: -8.0476, longitude: -34.877 },
        { user_id: '2', latitude: -8.0478, longitude: -34.878 },
      ]
      
      const suppress = shouldSuppressNotifications(
        -8.0476, -34.877,
        userLocations,
        config
      )
      expect(suppress).toBe(false)
    })

    it('não deve suprimir quando não há usuários', () => {
      const suppress = shouldSuppressNotifications(
        -8.0476, -34.877,
        [],
        config
      )
      expect(suppress).toBe(false)
    })
  })

  describe('filterUsersForNotification', () => {
    const config: CrowdControlConfig = {
      proximityRadiusMeters: 500,
      maxNearbyUsers: 5,
    }

    it('deve filtrar usuários que já estão próximos', () => {
      const userLocations: UserLocation[] = [
        { user_id: '1', latitude: -8.0476, longitude: -34.877 },  // Próximo
        { user_id: '2', latitude: -8.0478, longitude: -34.878 },  // Próximo
        { user_id: '3', latitude: -8.1000, longitude: -34.900 },  // Longe
        { user_id: '4', latitude: -8.2000, longitude: -34.950 },  // Longe
      ]
      
      const toNotify = filterUsersForNotification(
        -8.0476, -34.877,
        userLocations,
        config
      )
      
      expect(toNotify).toHaveLength(2)
      expect(toNotify.map(u => u.user_id)).toEqual(['3', '4'])
    })

    it('deve retornar lista vazia quando crowd control está ativo', () => {
      const manyNearbyUsers: UserLocation[] = Array.from({ length: 6 }, (_, i) => ({
        user_id: String(i),
        latitude: -8.0476 + i * 0.0001,
        longitude: -34.877 + i * 0.0001,
      }))
      
      const toNotify = filterUsersForNotification(
        -8.0476, -34.877,
        manyNearbyUsers,
        config
      )
      
      expect(toNotify).toHaveLength(0)
    })
  })

  describe('getCrowdStats', () => {
    const config: CrowdControlConfig = {
      proximityRadiusMeters: 500,
      maxNearbyUsers: 3,
    }

    it('deve retornar estatísticas corretas', () => {
      const userLocations: UserLocation[] = [
        { user_id: '1', latitude: -8.0476, longitude: -34.877 },
        { user_id: '2', latitude: -8.0478, longitude: -34.878 },
        { user_id: '3', latitude: -8.1000, longitude: -34.900 },
      ]
      
      const stats = getCrowdStats(-8.0476, -34.877, userLocations, config)
      
      expect(stats.nearbyCount).toBe(2)
      expect(stats.threshold).toBe(3)
      expect(stats.isSuppressed).toBe(false)
      expect(stats.usersToNotify).toBe(1)
    })

    it('deve indicar supressão corretamente', () => {
      const userLocations: UserLocation[] = [
        { user_id: '1', latitude: -8.0476, longitude: -34.877 },
        { user_id: '2', latitude: -8.0477, longitude: -34.877 },
        { user_id: '3', latitude: -8.0478, longitude: -34.877 },
        { user_id: '4', latitude: -8.1000, longitude: -34.900 },
      ]
      
      const stats = getCrowdStats(-8.0476, -34.877, userLocations, config)
      
      expect(stats.nearbyCount).toBe(3)
      expect(stats.isSuppressed).toBe(true)
      expect(stats.usersToNotify).toBe(0)
    })
  })
})
