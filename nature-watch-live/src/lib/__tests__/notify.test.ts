import { describe, expect, it } from "vitest";
import { getRecipients } from "../notify";

const s = { animalType: "jaguar", lat: -8.063, lng: -34.871 };

describe("notify", () => {
  it("matches subscribers to animal type", () => {
    const recipients = getRecipients(s, [
      { userId: "a", animalTypes: ["jaguar"] },
      { userId: "b", animalTypes: ["bird"] },
    ]);
    expect(recipients).toEqual(["a"]);
  });
  it("filters by distance", () => {
    const recipients = getRecipients(
      s,
      [
        { userId: "near", animalTypes: ["jaguar"], position: { lat: s.lat, lng: s.lng } },
        { userId: "far", animalTypes: ["jaguar"], position: { lat: 0, lng: 0 } },
      ],
      1000,
    );
    expect(recipients).toEqual(["near"]);
  });
});