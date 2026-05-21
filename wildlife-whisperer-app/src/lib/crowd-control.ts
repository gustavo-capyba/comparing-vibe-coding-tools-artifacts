import { distanceMeters } from "./geo";

export interface UserLocation {
  userId: string;
  lat: number;
  lng: number;
}

export interface CrowdOptions {
  /** Radius in meters considered "near" the sighting. */
  radiusMeters: number;
  /** Max users allowed within radius before notifications are suppressed. */
  threshold: number;
}

/**
 * Returns true when the number of users near a sighting reaches the
 * threshold, which means notifications should be SUPPRESSED.
 */
export function shouldSuppressNotifications(
  sighting: { lat: number; lng: number },
  users: UserLocation[],
  opts: CrowdOptions,
): boolean {
  const nearby = users.filter(
    (u) => distanceMeters(sighting, u) <= opts.radiusMeters,
  );
  return nearby.length >= opts.threshold;
}
