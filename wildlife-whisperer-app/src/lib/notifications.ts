import { distanceMeters } from "./geo";
import { shouldSuppressNotifications, type UserLocation } from "./crowd-control";

export interface NotifySubscriber {
  userId: string;
  email: string;
  animalTypes: string[];
  location?: { lat: number; lng: number };
}

export interface Sighting {
  id: string;
  animalType: string;
  lat: number;
  lng: number;
}

export interface NotifyOptions {
  /** Max distance to consider a subscriber "nearby" the sighting (meters). */
  nearbyRadius: number;
  /** Crowd suppression threshold. */
  crowdThreshold: number;
  /** Crowd radius. */
  crowdRadius: number;
}

/**
 * Computes which subscribers should be notified about a sighting.
 * Rules:
 *  - subscriber must be subscribed to the animal type
 *  - subscriber must be within nearbyRadius of the sighting
 *  - if the area is crowded, notifications are suppressed
 */
export function computeNotifyTargets(
  sighting: Sighting,
  subscribers: NotifySubscriber[],
  nearbyUsers: UserLocation[],
  opts: NotifyOptions,
): NotifySubscriber[] {
  if (
    shouldSuppressNotifications(sighting, nearbyUsers, {
      radiusMeters: opts.crowdRadius,
      threshold: opts.crowdThreshold,
    })
  ) {
    return [];
  }

  return subscribers.filter((s) => {
    if (!s.animalTypes.includes(sighting.animalType)) return false;
    if (!s.location) return true;
    return distanceMeters(sighting, s.location) <= opts.nearbyRadius;
  });
}

/** Simulated email "send" — logs to console. */
export function sendEmailNotification(
  to: string,
  sighting: Sighting,
): { sent: true; to: string } {
  // eslint-disable-next-line no-console
  console.log(
    `[email] To: ${to} — Wildlife sighting: ${sighting.animalType} at (${sighting.lat.toFixed(4)}, ${sighting.lng.toFixed(4)})`,
  );
  return { sent: true, to };
}
