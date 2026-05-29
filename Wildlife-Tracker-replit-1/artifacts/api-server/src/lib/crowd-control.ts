/**
 * Crowd control logic.
 * Determines whether notifications should be suppressed near a sighting
 * based on a configurable crowd threshold.
 */

export const CROWD_THRESHOLD = 5;

/** Distance in km between two lat/lng points using Haversine formula */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if notifications should be suppressed for a sighting.
 * Returns true (suppressed) when crowd count meets or exceeds the threshold.
 */
export function shouldSuppressNotifications(crowdCount: number, threshold = CROWD_THRESHOLD): boolean {
  return crowdCount >= threshold;
}

/**
 * Count how many sightings are within radiusKm of the given coordinates.
 */
export function countNearbySightings(
  lat: number,
  lon: number,
  sightings: Array<{ latitude: number; longitude: number }>,
  radiusKm = 0.5
): number {
  return sightings.filter(
    (s) => haversineDistance(lat, lon, s.latitude, s.longitude) <= radiusKm
  ).length;
}
