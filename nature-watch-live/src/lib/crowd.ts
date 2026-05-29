import { distanceMeters } from "./geo";

export interface UserPosition {
  userId: string;
  lat: number;
  lng: number;
}

export interface CrowdOptions {
  /** radius in meters considered "near" the sighting */
  radiusMeters?: number;
  /** max users in radius before notifications are suppressed */
  threshold?: number;
}

/**
 * Returns true if too many users are near the sighting and notifications
 * should be suppressed.
 */
export function shouldSuppressNotifications(
  sighting: { lat: number; lng: number },
  users: UserPosition[],
  opts: CrowdOptions = {},
): boolean {
  const radius = opts.radiusMeters ?? 200;
  const threshold = opts.threshold ?? 5;
  const nearby = users.filter(
    (u) => distanceMeters(sighting, u) <= radius,
  ).length;
  return nearby >= threshold;
}