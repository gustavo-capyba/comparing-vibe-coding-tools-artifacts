// Crowd control + notification suppression logic.

export interface Point {
  lat: number;
  lng: number;
}

/** Haversine distance in meters. */
export function distanceMeters(a: Point, b: Point): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Count users within radius (meters) of a sighting. */
export function countNearby(
  sighting: Point,
  users: Point[],
  radiusMeters: number,
): number {
  return users.filter((u) => distanceMeters(sighting, u) <= radiusMeters).length;
}

export interface CrowdRule {
  radiusMeters: number;
  threshold: number;
}

/** True when the crowd already exceeds threshold — suppress notification. */
export function isCrowded(
  sighting: Point,
  users: Point[],
  rule: CrowdRule,
): boolean {
  return countNearby(sighting, users, rule.radiusMeters) >= rule.threshold;
}

export interface NotifyContext {
  sighting: { animalType: string; location: Point };
  user: { id: string; subscriptions: string[]; location: Point | null };
  nearbyUsers: Point[];
  rule: CrowdRule;
  proximityMeters: number; // notify only when user within this radius
}

/** Decide whether the user should be notified. */
export function shouldNotify(ctx: NotifyContext): boolean {
  if (!ctx.user.subscriptions.includes(ctx.sighting.animalType)) return false;
  if (!ctx.user.location) return false;
  const dist = distanceMeters(ctx.sighting.location, ctx.user.location);
  if (dist > ctx.proximityMeters) return false;
  if (isCrowded(ctx.sighting.location, ctx.nearbyUsers, ctx.rule)) return false;
  return true;
}
