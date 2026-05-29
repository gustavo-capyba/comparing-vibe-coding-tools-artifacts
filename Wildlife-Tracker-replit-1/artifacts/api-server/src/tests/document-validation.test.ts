import {
  validateCPF,
  validateRG,
  validateDriverLicense,
  validateDocument,
} from "../lib/document-validation";

// Simple test runner
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
    toContain(substr: string) {
      if (typeof actual !== "string" || !actual.includes(substr)) {
        throw new Error(`Expected "${actual}" to contain "${substr}"`);
      }
    },
  };
}

console.log("\n=== Document Validation Tests ===\n");

console.log("CPF validation:");
test("valid CPF passes", () => {
  const r = validateCPF("529.982.247-25");
  expect(r.valid).toBe(true);
});
test("CPF with only digits passes", () => {
  const r = validateCPF("52998224725");
  expect(r.valid).toBe(true);
});
test("all-same-digit CPF fails", () => {
  const r = validateCPF("111.111.111-11");
  expect(r.valid).toBe(false);
});
test("too short CPF fails", () => {
  const r = validateCPF("123.456.789");
  expect(r.valid).toBe(false);
});
test("wrong check digit CPF fails", () => {
  const r = validateCPF("529.982.247-99");
  expect(r.valid).toBe(false);
});

console.log("\nRG validation:");
test("valid 7-char RG passes", () => {
  const r = validateRG("1234567");
  expect(r.valid).toBe(true);
});
test("valid 9-char RG passes", () => {
  const r = validateRG("12.345.678-9");
  expect(r.valid).toBe(true);
});
test("RG too short fails", () => {
  const r = validateRG("12345");
  expect(r.valid).toBe(false);
});
test("RG too long fails", () => {
  const r = validateRG("1234567890");
  expect(r.valid).toBe(false);
});

console.log("\nDriver License validation:");
test("valid US license passes", () => {
  const r = validateDriverLicense("D1234567");
  expect(r.valid).toBe(true);
});
test("too short license fails", () => {
  const r = validateDriverLicense("AB12");
  expect(r.valid).toBe(false);
});
test("too long license fails", () => {
  const r = validateDriverLicense("ABCDEFGH123456789");
  expect(r.valid).toBe(false);
});

console.log("\nDocument routing by nationality:");
test("BR + cpf + valid CPF passes", () => {
  const r = validateDocument("BR", "cpf", "529.982.247-25");
  expect(r.valid).toBe(true);
});
test("BR + rg + valid RG passes", () => {
  const r = validateDocument("BR", "rg", "12.345.678-9");
  expect(r.valid).toBe(true);
});
test("BR + driver_license fails", () => {
  const r = validateDocument("BR", "driver_license", "D1234567");
  expect(r.valid).toBe(false);
  expect(r.error!).toContain("cpf or rg");
});
test("US + driver_license passes", () => {
  const r = validateDocument("US", "driver_license", "D1234567");
  expect(r.valid).toBe(true);
});
test("US + cpf fails", () => {
  const r = validateDocument("US", "cpf", "529.982.247-25");
  expect(r.valid).toBe(false);
  expect(r.error!).toContain("driver_license");
});
test("lowercase nationality works", () => {
  const r = validateDocument("br", "cpf", "529.982.247-25");
  expect(r.valid).toBe(true);
});

console.log("\n=== Results ===");
console.log(`Passed: ${passed}, Failed: ${failed}`);
if (failed > 0) process.exit(1);
