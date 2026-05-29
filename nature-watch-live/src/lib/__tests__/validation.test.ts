import { describe, expect, it } from "vitest";
import {
  isValidCPF,
  isValidRG,
  isValidUSLicense,
  isValidPhone,
  isValidPlate,
  validateDocument,
} from "../validation";

describe("CPF", () => {
  it("accepts a valid CPF", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
  });
  it("rejects bad checksum", () => {
    expect(isValidCPF("529.982.247-26")).toBe(false);
  });
  it("rejects repeating digits", () => {
    expect(isValidCPF("11111111111")).toBe(false);
  });
});

describe("RG / US license", () => {
  it("accepts RG length", () => {
    expect(isValidRG("12.345.678-9")).toBe(true);
  });
  it("rejects short RG", () => {
    expect(isValidRG("123")).toBe(false);
  });
  it("accepts US driver license", () => {
    expect(isValidUSLicense("D1234567")).toBe(true);
  });
  it("rejects too short license", () => {
    expect(isValidUSLicense("AB1")).toBe(false);
  });
});

describe("validateDocument", () => {
  it("BR + CPF works", () => {
    expect(validateDocument("BR", "CPF", "529.982.247-25").ok).toBe(true);
  });
  it("BR rejects DL", () => {
    expect(validateDocument("BR", "DL", "X").ok).toBe(false);
  });
  it("US + DL works", () => {
    expect(validateDocument("US", "DL", "D1234567").ok).toBe(true);
  });
  it("US rejects CPF", () => {
    expect(validateDocument("US", "CPF", "529.982.247-25").ok).toBe(false);
  });
});

describe("phone & plate", () => {
  it("accepts phone", () => {
    expect(isValidPhone("+55 (81) 99999-1234")).toBe(true);
  });
  it("rejects bad phone", () => {
    expect(isValidPhone("abc")).toBe(false);
  });
  it("accepts plate", () => {
    expect(isValidPlate("ABC1D23")).toBe(true);
  });
  it("rejects short plate", () => {
    expect(isValidPlate("A1")).toBe(false);
  });
});