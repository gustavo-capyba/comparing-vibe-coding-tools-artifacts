/**
 * Crowd control logic.
 * If the number of users who have reported sightings within a given radius
 * in the last `windowMs` milliseconds exceeds `threshold`, notifications
 * for new sightings at that location are suppressed.
 */

export const CROWD_THRESHOLD = 5;
export const CROWD_RADIUS_KM = 0.5;
export const CROWD_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Calculate distance between two lat/lng points in kilometers (Haversine).
 */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Determine if notifications should be suppressed for a new sighting.
 * @param recentSightings - sightings from the last CROWD_WINDOW_MS
 * @param lat - latitude of the new sighting
 * @param lng - longitude of the new sighting
 * @returns { suppressed: boolean; crowdCount: number }
 */
export function checkCrowdControl(
  recentSightings: Array<{ latitude: number; longitude: number; userId: number; timestamp: Date }>,
  lat: number,
  lng: number
): { suppressed: boolean; crowdCount: number } {
  const cutoff = new Date(Date.now() - CROWD_WINDOW_MS);
  const nearby = recentSightings.filter(
    (s) =>
      s.timestamp >= cutoff &&
      haversineKm(lat, lng, s.latitude, s.longitude) <= CROWD_RADIUS_KM
  );
  const uniqueUsers = new Set(nearby.map((s) => s.userId)).size;
  return {
    crowdCount: uniqueUsers,
    suppressed: uniqueUsers >= CROWD_THRESHOLD,
  };
}
