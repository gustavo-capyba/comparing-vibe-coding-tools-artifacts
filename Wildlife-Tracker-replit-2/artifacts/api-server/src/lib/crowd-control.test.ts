import { checkCrowdControl, CROWD_THRESHOLD, CROWD_RADIUS_KM, CROWD_WINDOW_MS, haversineKm } from "./crowd-control";

// ============================================================
// Crowd Control & Notification Logic Unit Tests
// ============================================================

const BASE_LAT = -8.063169;
const BASE_LNG = -34.871139;

function makeSighting(userId: number, lat = BASE_LAT, lng = BASE_LNG, offsetMs = 0) {
  return {
    userId,
    latitude: lat,
    longitude: lng,
    timestamp: new Date(Date.now() - offsetMs),
  };
}

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm(0, 0, 0, 0)).toBeCloseTo(0);
  });

  it("calculates a known distance", () => {
    // Recife to Olinda: ~10 km
    const dist = haversineKm(-8.063169, -34.871139, -7.978, -34.847);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(20);
  });

  it("returns a positive value for distant points", () => {
    expect(haversineKm(-8.063169, -34.871139, -23.55, -46.63)).toBeGreaterThan(100);
  });
});

describe("checkCrowdControl — suppression logic", () => {
  it("does not suppress when fewer than threshold users are nearby", () => {
    const sightings = Array.from({ length: CROWD_THRESHOLD - 1 }, (_, i) =>
      makeSighting(i + 1)
    );
    const { suppressed, crowdCount } = checkCrowdControl(sightings, BASE_LAT, BASE_LNG);
    expect(suppressed).toBe(false);
    expect(crowdCount).toBe(CROWD_THRESHOLD - 1);
  });

  it("suppresses when threshold users are nearby", () => {
    const sightings = Array.from({ length: CROWD_THRESHOLD }, (_, i) =>
      makeSighting(i + 1)
    );
    const { suppressed, crowdCount } = checkCrowdControl(sightings, BASE_LAT, BASE_LNG);
    expect(suppressed).toBe(true);
    expect(crowdCount).toBe(CROWD_THRESHOLD);
  });

  it("suppresses when more than threshold users are nearby", () => {
    const sightings = Array.from({ length: CROWD_THRESHOLD + 3 }, (_, i) =>
      makeSighting(i + 1)
    );
    const { suppressed } = checkCrowdControl(sightings, BASE_LAT, BASE_LNG);
    expect(suppressed).toBe(true);
  });

  it("counts each user only once even with multiple sightings", () => {
    // Same user, 5 sightings — should count as 1 unique user
    const sightings = Array.from({ length: 10 }, () => makeSighting(42));
    const { crowdCount, suppressed } = checkCrowdControl(sightings, BASE_LAT, BASE_LNG);
    expect(crowdCount).toBe(1);
    expect(suppressed).toBe(false);
  });

  it("ignores sightings outside the time window", () => {
    const sightings = Array.from({ length: CROWD_THRESHOLD }, (_, i) =>
      makeSighting(i + 1, BASE_LAT, BASE_LNG, CROWD_WINDOW_MS + 1000) // too old
    );
    const { suppressed, crowdCount } = checkCrowdControl(sightings, BASE_LAT, BASE_LNG);
    expect(suppressed).toBe(false);
    expect(crowdCount).toBe(0);
  });

  it("ignores sightings outside the radius", () => {
    // ~2 km away — outside CROWD_RADIUS_KM of 0.5 km
    const farLat = BASE_LAT + 0.02;
    const farLng = BASE_LNG + 0.02;
    const sightings = Array.from({ length: CROWD_THRESHOLD }, (_, i) =>
      makeSighting(i + 1, farLat, farLng)
    );
    const { suppressed, crowdCount } = checkCrowdControl(sightings, BASE_LAT, BASE_LNG);
    expect(suppressed).toBe(false);
    expect(crowdCount).toBe(0);
  });

  it("only counts sightings within both time window and radius", () => {
    const recentNearby = Array.from({ length: 2 }, (_, i) => makeSighting(i + 1));
    const oldNearby = Array.from({ length: 3 }, (_, i) =>
      makeSighting(i + 10, BASE_LAT, BASE_LNG, CROWD_WINDOW_MS + 1000)
    );
    const recentFar = Array.from({ length: 5 }, (_, i) =>
      makeSighting(i + 20, BASE_LAT + 0.05, BASE_LNG + 0.05)
    );

    const { crowdCount, suppressed } = checkCrowdControl(
      [...recentNearby, ...oldNearby, ...recentFar],
      BASE_LAT,
      BASE_LNG
    );
    expect(crowdCount).toBe(2);
    expect(suppressed).toBe(false);
  });

  it("returns zero crowd count with no sightings", () => {
    const { crowdCount, suppressed } = checkCrowdControl([], BASE_LAT, BASE_LNG);
    expect(crowdCount).toBe(0);
    expect(suppressed).toBe(false);
  });
});
