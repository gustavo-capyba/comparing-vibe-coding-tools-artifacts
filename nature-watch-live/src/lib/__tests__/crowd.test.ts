import { describe, expect, it } from "vitest";
import { shouldSuppressNotifications } from "../crowd";

const sighting = { lat: -8.063, lng: -34.871 };

function nearbyUsers(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    userId: `u${i}`,
    lat: sighting.lat + 0.0001 * i,
    lng: sighting.lng,
  }));
}

describe("crowd control", () => {
  it("does not suppress when below threshold", () => {
    expect(
      shouldSuppressNotifications(sighting, nearbyUsers(3), { threshold: 5 }),
    ).toBe(false);
  });
  it("suppresses at/over threshold", () => {
    expect(
      shouldSuppressNotifications(sighting, nearbyUsers(6), { threshold: 5 }),
    ).toBe(true);
  });
  it("ignores far-away users", () => {
    const far = [{ userId: "x", lat: sighting.lat + 1, lng: sighting.lng + 1 }];
    expect(shouldSuppressNotifications(sighting, far, { threshold: 1 })).toBe(false);
  });
});