import { shouldSuppressNotifications, CROWD_THRESHOLD } from "../lib/crowd-control";

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
  };
}

// Simulate the notification dispatch logic in isolation
interface MockSighting {
  animalType: string;
  crowdCount: number;
}

interface MockSubscription {
  userId: number;
  animalType: string;
}

function shouldNotify(sighting: MockSighting, subscriptions: MockSubscription[], creatingUserId: number): number[] {
  if (shouldSuppressNotifications(sighting.crowdCount)) return [];
  return subscriptions
    .filter(s => s.animalType === sighting.animalType && s.userId !== creatingUserId)
    .map(s => s.userId);
}

console.log("\n=== Notification Logic Tests ===\n");

const subscriptions: MockSubscription[] = [
  { userId: 1, animalType: "Jaguar" },
  { userId: 2, animalType: "Jaguar" },
  { userId: 3, animalType: "Capybara" },
];

console.log("Subscriber targeting:");
test("notifies matching subscribers", () => {
  const notified = shouldNotify({ animalType: "Jaguar", crowdCount: 1 }, subscriptions, 99);
  expect(notified.length).toBe(2);
});
test("does not notify creating user", () => {
  const notified = shouldNotify({ animalType: "Jaguar", crowdCount: 1 }, subscriptions, 1);
  expect(notified.includes(1)).toBe(false);
  expect(notified.includes(2)).toBe(true);
});
test("does not notify users subscribed to other animals", () => {
  const notified = shouldNotify({ animalType: "Jaguar", crowdCount: 1 }, subscriptions, 99);
  expect(notified.includes(3)).toBe(false);
});
test("returns empty array for no matching subscribers", () => {
  const notified = shouldNotify({ animalType: "Anaconda", crowdCount: 1 }, subscriptions, 99);
  expect(notified.length).toBe(0);
});

console.log("\nCrowd suppression:");
test(`suppresses when crowdCount >= ${CROWD_THRESHOLD}`, () => {
  const notified = shouldNotify({ animalType: "Jaguar", crowdCount: CROWD_THRESHOLD }, subscriptions, 99);
  expect(notified.length).toBe(0);
});
test(`allows notifications when crowdCount < ${CROWD_THRESHOLD}`, () => {
  const notified = shouldNotify({ animalType: "Jaguar", crowdCount: CROWD_THRESHOLD - 1 }, subscriptions, 99);
  expect(notified.length).toBe(2);
});
test("suppresses above threshold too", () => {
  const notified = shouldNotify({ animalType: "Jaguar", crowdCount: 10 }, subscriptions, 99);
  expect(notified.length).toBe(0);
});

console.log("\n=== Results ===");
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
