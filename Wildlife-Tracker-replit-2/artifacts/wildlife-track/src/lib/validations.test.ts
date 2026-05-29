import { validateDocument } from "./validations";

// ============================================================
// Document Validation Unit Tests
// Run with: npx vitest run src/lib/validations.test.ts
// ============================================================

describe("validateDocument — BR CPF", () => {
  it("accepts a valid CPF (formatted)", () => {
    expect(validateDocument("BR", "CPF", "529.982.247-25")).toBe(true);
  });

  it("accepts a valid CPF (digits only)", () => {
    expect(validateDocument("BR", "CPF", "52998224725")).toBe(true);
  });

  it("rejects an invalid CPF", () => {
    expect(validateDocument("BR", "CPF", "111.111.111-11")).toBe(false);
  });

  it("rejects a CPF with wrong length", () => {
    expect(validateDocument("BR", "CPF", "1234567")).toBe(false);
  });

  it("rejects empty CPF", () => {
    expect(validateDocument("BR", "CPF", "")).toBe(false);
  });
});

describe("validateDocument — BR RG", () => {
  it("accepts a valid RG (7 digits)", () => {
    expect(validateDocument("BR", "RG", "1234567")).toBe(true);
  });

  it("accepts a valid RG (9 digits with dashes)", () => {
    expect(validateDocument("BR", "RG", "12.345.678-9")).toBe(true);
  });

  it("accepts an RG with 9 clean digits", () => {
    expect(validateDocument("BR", "RG", "123456789")).toBe(true);
  });

  it("rejects an RG that is too short", () => {
    expect(validateDocument("BR", "RG", "123456")).toBe(false);
  });

  it("rejects an RG that is too long", () => {
    expect(validateDocument("BR", "RG", "1234567890")).toBe(false);
  });
});

describe("validateDocument — US Driver License", () => {
  it("accepts a valid US driver license", () => {
    expect(validateDocument("US", "DL", "D1234567")).toBe(true);
  });

  it("accepts a minimal valid license (5 chars)", () => {
    expect(validateDocument("US", "DL", "AB123")).toBe(true);
  });

  it("accepts a maximum length license (20 chars)", () => {
    expect(validateDocument("US", "DL", "A1B2C3D4E5F6G7H8I9J0")).toBe(true);
  });

  it("rejects a license that is too short", () => {
    expect(validateDocument("US", "DL", "ABC")).toBe(false);
  });

  it("rejects a license that is too long", () => {
    expect(validateDocument("US", "DL", "A".repeat(21))).toBe(false);
  });
});

describe("validateDocument — cross-nationality edge cases", () => {
  it("rejects unknown nationality gracefully", () => {
    // @ts-expect-error testing invalid input
    expect(validateDocument("FR", "PASSEPORT", "ABC123")).toBe(false);
  });
});
