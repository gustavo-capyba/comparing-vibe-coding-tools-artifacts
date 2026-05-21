import { describe, it, expect } from "vitest";
import { shouldSuppressNotifications } from "./crowd-control";

const sighting = { lat: -8.063, lng: -34.871 };

describe("shouldSuppressNotifications", () => {
  it("does not suppress with few nearby users", () => {
    const users = [
      { userId: "a", lat: -8.063, lng: -34.871 },
      { userId: "b", lat: -8.064, lng: -34.872 },
    ];
    expect(
      shouldSuppressNotifications(sighting, users, { radiusMeters: 500, threshold: 5 }),
    ).toBe(false);
  });

  it("suppresses when threshold is reached within radius", () => {
    const users = Array.from({ length: 6 }, (_, i) => ({
      userId: String(i),
      lat: -8.063 + i * 0.0001,
      lng: -34.871,
    }));
    expect(
      shouldSuppressNotifications(sighting, users, { radiusMeters: 500, threshold: 5 }),
    ).toBe(true);
  });

  it("ignores users outside the radius", () => {
    const users = Array.from({ length: 10 }, (_, i) => ({
      userId: String(i),
      lat: -9 + i * 0.01,
      lng: -34,
    }));
    expect(
      shouldSuppressNotifications(sighting, users, { radiusMeters: 500, threshold: 3 }),
    ).toBe(false);
  });
});
