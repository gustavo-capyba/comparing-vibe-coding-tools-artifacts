import { describe, it, expect } from "vitest";
import { distanceMeters, countNearby, isCrowded, shouldNotify } from "../crowd";

const recife = { lat: -8.063169, lng: -34.871139 };
const nearby = { lat: -8.0633, lng: -34.8713 }; // ~30m away
const farAway = { lat: -8.1, lng: -34.9 };

describe("distanceMeters", () => {
  it("is ~0 for same point", () => {
    expect(distanceMeters(recife, recife)).toBeLessThan(1);
  });
  it("computes a small distance for nearby points", () => {
    expect(distanceMeters(recife, nearby)).toBeLessThan(100);
  });
  it("computes larger distance for far points", () => {
    expect(distanceMeters(recife, farAway)).toBeGreaterThan(1000);
  });
});

describe("countNearby / isCrowded", () => {
  const rule = { radiusMeters: 200, threshold: 3 };
  it("counts users within radius", () => {
    expect(countNearby(recife, [nearby, nearby, farAway], 200)).toBe(2);
  });
  it("not crowded below threshold", () => {
    expect(isCrowded(recife, [nearby, nearby], rule)).toBe(false);
  });
  it("crowded at/above threshold", () => {
    expect(isCrowded(recife, [nearby, nearby, nearby], rule)).toBe(true);
  });
});

describe("shouldNotify", () => {
  const rule = { radiusMeters: 200, threshold: 3 };
  const base = {
    sighting: { animalType: "Capybara", location: recife },
    user: { id: "u1", subscriptions: ["Capybara"], location: nearby },
    nearbyUsers: [nearby],
    rule,
    proximityMeters: 5000,
  };

  it("notifies subscribed nearby user", () => {
    expect(shouldNotify(base)).toBe(true);
  });
  it("skips when not subscribed", () => {
    expect(shouldNotify({ ...base, user: { ...base.user, subscriptions: [] } })).toBe(false);
  });
  it("skips when too far", () => {
    expect(
      shouldNotify({ ...base, user: { ...base.user, location: farAway } }),
    ).toBe(false);
  });
  it("suppresses when crowded", () => {
    expect(
      shouldNotify({ ...base, nearbyUsers: [nearby, nearby, nearby] }),
    ).toBe(false);
  });
  it("skips when location unknown", () => {
    expect(shouldNotify({ ...base, user: { ...base.user, location: null } })).toBe(false);
  });
});
