import { describe, it, expect } from "vitest";
import {
  isValidCPF,
  isValidRG,
  isValidUSDriverLicense,
  validateDocument,
} from "./validators";

describe("isValidCPF", () => {
  it("accepts a valid CPF", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("52998224725")).toBe(true);
  });
  it("rejects invalid CPFs", () => {
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("12345678900")).toBe(false);
    expect(isValidCPF("123")).toBe(false);
    expect(isValidCPF("")).toBe(false);
  });
});

describe("isValidRG", () => {
  it("accepts well-formed RG strings", () => {
    expect(isValidRG("12.345.678-9")).toBe(true);
    expect(isValidRG("123456789X")).toBe(true);
  });
  it("rejects bad RG strings", () => {
    expect(isValidRG("123")).toBe(false);
    expect(isValidRG("ABCDEFG")).toBe(false);
  });
});

describe("isValidUSDriverLicense", () => {
  it("accepts plausible licenses", () => {
    expect(isValidUSDriverLicense("D1234567")).toBe(true);
    expect(isValidUSDriverLicense("A12-345-67")).toBe(true);
  });
  it("rejects too-short or symbol-laden inputs", () => {
    expect(isValidUSDriverLicense("ABC")).toBe(false);
    expect(isValidUSDriverLicense("???????")).toBe(false);
  });
});

describe("validateDocument", () => {
  it("validates BR CPF", () => {
    expect(validateDocument({ nationality: "BR", documentType: "CPF", documentNumber: "529.982.247-25" }).valid).toBe(true);
  });
  it("rejects BR with US_DL", () => {
    expect(validateDocument({ nationality: "BR", documentType: "US_DL", documentNumber: "D1234567" }).valid).toBe(false);
  });
  it("validates US driver license", () => {
    expect(validateDocument({ nationality: "US", documentType: "US_DL", documentNumber: "D1234567" }).valid).toBe(true);
  });
  it("rejects empty document", () => {
    expect(validateDocument({ nationality: "BR", documentType: "CPF", documentNumber: "" }).valid).toBe(false);
  });
});
