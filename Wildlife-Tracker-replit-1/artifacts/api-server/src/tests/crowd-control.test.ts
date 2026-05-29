import {
  haversineDistance,
  shouldSuppressNotifications,
  countNearbySightings,
  CROWD_THRESHOLD,
} from "../lib/crowd-control";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err}`);
    failed++;
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
      }
    },
    toBeCloseTo(expected: number, decimals = 1) {
      const factor = Math.pow(10, decimals);
      const actualRounded = Math.round((actual as number) * factor) / factor;
      const expectedRounded = Math.round(expected * factor) / factor;
      if (actualRounded !== expectedRounded) {
        throw new Error(`Expected ~${expected} but got ${actual}`);
      }
    },
    toBeLessThan(limit: number) {
      if ((actual as number) >= limit) {
        throw new Error(`Expected ${actual} to be less than ${limit}`);
      }
    },
    toBeGreaterThan(limit: number) {
      if ((actual as number) <= limit) {
        throw new Error(`Expected ${actual} to be greater than ${limit}`);
      }
    },
  };
}

console.log("\n=== Crowd Control Tests ===\n");

console.log("Haversine distance:");
test("same coordinates = 0 km", () => {
  const d = haversineDistance(-8.063169, -34.871139, -8.063169, -34.871139);
  expect(d).toBe(0);
});
test("known distance is roughly correct (~111 km per degree)", () => {
  const d = haversineDistance(0, 0, 1, 0);
  expect(d).toBeCloseTo(111.2, 0);
});
test("distance is symmetric", () => {
  const d1 = haversineDistance(-8.063, -34.871, -8.070, -34.878);
  const d2 = haversineDistance(-8.070, -34.878, -8.063, -34.871);
  expect(Math.abs(d1 - d2) < 0.0001).toBe(true);
});

console.log("\nNotification suppression:");
test("below threshold: not suppressed", () => {
  expect(shouldSuppressNotifications(CROWD_THRESHOLD - 1)).toBe(false);
});
test("at threshold: suppressed", () => {
  expect(shouldSuppressNotifications(CROWD_THRESHOLD)).toBe(true);
});
test("above threshold: suppressed", () => {
  expect(shouldSuppressNotifications(CROWD_THRESHOLD + 3)).toBe(true);
});
test("custom threshold works", () => {
  expect(shouldSuppressNotifications(3, 3)).toBe(true);
  expect(shouldSuppressNotifications(2, 3)).toBe(false);
});

console.log("\nNearby sightings count:");
const center = { latitude: -8.063169, longitude: -34.871139 };
const nearbySightings = [
  { latitude: -8.064, longitude: -34.872 },  // ~150m away
  { latitude: -8.063, longitude: -34.870 },  // ~100m away
  { latitude: -8.100, longitude: -34.900 },  // ~6km away
];

test("counts sightings within radius", () => {
  const count = countNearbySightings(center.latitude, center.longitude, nearbySightings, 0.5);
  expect(count).toBe(2);
});
test("excludes sightings outside radius", () => {
  const count = countNearbySightings(center.latitude, center.longitude, nearbySightings, 0.5);
  expect(count < 3).toBe(true);
});
test("empty sightings list = 0", () => {
  const count = countNearbySightings(center.latitude, center.longitude, [], 1);
  expect(count).toBe(0);
});
test("very small radius excludes all", () => {
  const count = countNearbySightings(center.latitude, center.longitude, nearbySightings, 0.01);
  expect(count).toBe(0);
});

console.log("\n=== Results ===");
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
