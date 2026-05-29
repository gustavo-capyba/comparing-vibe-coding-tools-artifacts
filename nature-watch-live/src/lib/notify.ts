import { distanceMeters } from "./geo";

export interface Subscriber {
  userId: string;
  animalTypes: string[];
  position?: { lat: number; lng: number };
}

export interface Sighting {
  animalType: string;
  lat: number;
  lng: number;
}

/**
 * Determine which subscribers should be notified about a sighting.
 * A subscriber is notified if they subscribe to that animal type AND
 * are within `nearMeters` of the sighting (or have no known position).
 */
export function getRecipients(
  sighting: Sighting,
  subs: Subscriber[],
  nearMeters = 5000,
): string[] {
  return subs
    .filter((s) => s.animalTypes.includes(sighting.animalType))
    .filter((s) => {
      if (!s.position) return true;
      return distanceMeters(sighting, s.position) <= nearMeters;
    })
    .map((s) => s.userId);
}

/** Simulate sending an email — logs to console. */
export function sendEmailNotification(to: string, subject: string, body: string) {
  // eslint-disable-next-line no-console
  console.log(`[email] to=${to} subject="${subject}" body="${body}"`);
}