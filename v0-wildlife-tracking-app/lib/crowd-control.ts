/**
 * Crowd Control - Lógica para suprimir notificações quando muitos usuários
 * já estão próximos ao local do avistamento
 */

export interface UserLocation {
  user_id: string
  latitude: number
  longitude: number
}

export interface CrowdControlConfig {
  // Raio em metros para considerar usuários "próximos"
  proximityRadiusMeters: number
  // Número máximo de usuários próximos antes de suprimir notificações
  maxNearbyUsers: number
}

// Configuração padrão
export const DEFAULT_CROWD_CONFIG: CrowdControlConfig = {
  proximityRadiusMeters: 500, // 500 metros
  maxNearbyUsers: 10, // Se mais de 10 usuários estão dentro do raio, suprime notificações
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * @returns Distância em metros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Raio da Terra em metros
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
 * Conta quantos usuários estão dentro do raio de proximidade
 */
export function countNearbyUsers(
  targetLat: number,
  targetLon: number,
  userLocations: UserLocation[],
  radiusMeters: number
): number {
  return userLocations.filter((location) => {
    const distance = calculateDistance(
      targetLat,
      targetLon,
      location.latitude,
      location.longitude
    )
    return distance <= radiusMeters
  }).length
}

/**
 * Determina se as notificações devem ser suprimidas com base no crowd control
 * @returns true se as notificações devem ser suprimidas
 */
export function shouldSuppressNotifications(
  sightingLat: number,
  sightingLon: number,
  userLocations: UserLocation[],
  config: CrowdControlConfig = DEFAULT_CROWD_CONFIG
): boolean {
  const nearbyCount = countNearbyUsers(
    sightingLat,
    sightingLon,
    userLocations,
    config.proximityRadiusMeters
  )
  
  return nearbyCount >= config.maxNearbyUsers
}

/**
 * Filtra usuários que devem receber notificação
 * Remove usuários que já estão próximos ao local do avistamento
 */
export function filterUsersForNotification(
  sightingLat: number,
  sightingLon: number,
  userLocations: UserLocation[],
  config: CrowdControlConfig = DEFAULT_CROWD_CONFIG
): UserLocation[] {
  // Se já tem muita gente por perto, não notifica ninguém
  if (shouldSuppressNotifications(sightingLat, sightingLon, userLocations, config)) {
    return []
  }
  
  // Retorna apenas usuários que NÃO estão dentro do raio
  // (quem já está lá não precisa ser notificado)
  return userLocations.filter((location) => {
    const distance = calculateDistance(
      sightingLat,
      sightingLon,
      location.latitude,
      location.longitude
    )
    return distance > config.proximityRadiusMeters
  })
}

/**
 * Calcula estatísticas de crowd control para um local
 */
export function getCrowdStats(
  sightingLat: number,
  sightingLon: number,
  userLocations: UserLocation[],
  config: CrowdControlConfig = DEFAULT_CROWD_CONFIG
): {
  nearbyCount: number
  threshold: number
  isSuppressed: boolean
  usersToNotify: number
} {
  const nearbyCount = countNearbyUsers(
    sightingLat,
    sightingLon,
    userLocations,
    config.proximityRadiusMeters
  )
  
  const isSuppressed = nearbyCount >= config.maxNearbyUsers
  const usersToNotify = isSuppressed ? 0 : userLocations.length - nearbyCount
  
  return {
    nearbyCount,
    threshold: config.maxNearbyUsers,
    isSuppressed,
    usersToNotify,
  }
}
