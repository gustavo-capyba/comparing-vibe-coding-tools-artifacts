import { describe, it, expect } from "vitest";
import {
  isValidCPF,
  isValidRG,
  isValidUSDriverLicense,
  validateDocument,
  isValidPhone,
  isValidLicensePlate,
} from "../validation";

describe("CPF", () => {
  it("accepts a valid CPF", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
  });
  it("rejects all-same digits", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
  });
  it("rejects wrong length", () => {
    expect(isValidCPF("123")).toBe(false);
  });
});

describe("RG", () => {
  it("accepts 7-10 alphanumerics", () => {
    expect(isValidRG("12.345.678-9")).toBe(true);
    expect(isValidRG("MG1234567")).toBe(true);
  });
  it("rejects too short", () => {
    expect(isValidRG("123")).toBe(false);
  });
});

describe("US Driver License", () => {
  it("accepts plausible licenses", () => {
    expect(isValidUSDriverLicense("D1234567")).toBe(true);
  });
  it("rejects symbols", () => {
    expect(isValidUSDriverLicense("AB!@#")).toBe(false);
  });
});

describe("validateDocument", () => {
  it("BR + CPF works", () => {
    expect(validateDocument("BR", "CPF", "529.982.247-25").valid).toBe(true);
  });
  it("BR + RG works", () => {
    expect(validateDocument("BR", "RG", "MG1234567").valid).toBe(true);
  });
  it("BR rejects driver license", () => {
    expect(validateDocument("BR", "DRIVER_LICENSE", "X").valid).toBe(false);
  });
  it("US + driver license works", () => {
    expect(validateDocument("US", "DRIVER_LICENSE", "D1234567").valid).toBe(true);
  });
  it("US rejects CPF type", () => {
    expect(validateDocument("US", "CPF", "529.982.247-25").valid).toBe(false);
  });
});

describe("phone & plate", () => {
  it("valid phone", () => {
    expect(isValidPhone("+55 81 99999-1234")).toBe(true);
  });
  it("invalid short phone", () => {
    expect(isValidPhone("123")).toBe(false);
  });
  it("valid plate", () => {
    expect(isValidLicensePlate("ABC-1D23")).toBe(true);
    expect(isValidLicensePlate("7XYZ123")).toBe(true);
  });
  it("invalid plate", () => {
    expect(isValidLicensePlate("!!")).toBe(false);
  });
});
