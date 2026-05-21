import { describe, it, expect } from "vitest";
import { computeNotifyTargets } from "./notifications";

const sighting = { id: "s1", animalType: "Capybara", lat: -8.063, lng: -34.871 };

describe("computeNotifyTargets", () => {
  const subs = [
    { userId: "1", email: "a@x.com", animalTypes: ["Capybara"], location: { lat: -8.063, lng: -34.871 } },
    { userId: "2", email: "b@x.com", animalTypes: ["Jaguar"], location: { lat: -8.063, lng: -34.871 } },
    { userId: "3", email: "c@x.com", animalTypes: ["Capybara"], location: { lat: -9.0, lng: -34.871 } },
    { userId: "4", email: "d@x.com", animalTypes: ["Capybara"] },
  ];

  it("notifies matching subscribers in range", () => {
    const out = computeNotifyTargets(sighting, subs, [], {
      nearbyRadius: 5000,
      crowdRadius: 500,
      crowdThreshold: 10,
    });
    expect(out.map((s) => s.userId).sort()).toEqual(["1", "4"]);
  });

  it("suppresses when area is crowded", () => {
    const crowd = Array.from({ length: 10 }, (_, i) => ({
      userId: String(i),
      lat: -8.063,
      lng: -34.871,
    }));
    const out = computeNotifyTargets(sighting, subs, crowd, {
      nearbyRadius: 5000,
      crowdRadius: 500,
      crowdThreshold: 5,
    });
    expect(out).toEqual([]);
  });

  it("filters by animal type", () => {
    const out = computeNotifyTargets(
      { ...sighting, animalType: "Sloth" },
      subs,
      [],
      { nearbyRadius: 5000, crowdRadius: 500, crowdThreshold: 10 },
    );
    expect(out).toEqual([]);
  });
});
