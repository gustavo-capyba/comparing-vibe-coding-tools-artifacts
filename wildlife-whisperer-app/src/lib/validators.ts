// Document validation utilities for wildlife-track app.

/** Strip non-digit characters. */
const digits = (v: string) => v.replace(/\D/g, "");

/**
 * Validates a Brazilian CPF (11 digits with check digits).
 */
export function isValidCPF(value: string): boolean {
  const cpf = digits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  const calc = (slice: number) => {
    let sum = 0;
    for (let i = 0; i < slice; i++) sum += parseInt(cpf[i], 10) * (slice + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return calc(9) === parseInt(cpf[9], 10) && calc(10) === parseInt(cpf[10], 10);
}

/**
 * Validates a Brazilian RG. RG formats vary by state, so we accept
 * 7–14 alphanumeric chars (last may be 'X').
 */
export function isValidRG(value: string): boolean {
  const cleaned = value.replace(/[.\-\s]/g, "").toUpperCase();
  return /^[0-9]{6,13}[0-9X]$/.test(cleaned);
}

/**
 * Validates a US driver license number. Formats vary by state,
 * so we require 5–20 alphanumeric chars.
 */
export function isValidUSDriverLicense(value: string): boolean {
  const cleaned = value.replace(/[\s-]/g, "");
  return /^[A-Za-z0-9]{5,20}$/.test(cleaned);
}

export type Nationality = "BR" | "US";
export type DocumentType = "CPF" | "RG" | "US_DL";

export interface DocumentInput {
  nationality: Nationality;
  documentType: DocumentType;
  documentNumber: string;
}

/**
 * Validates a document according to nationality rules:
 * - BR: CPF or RG
 * - US: US driver license
 */
export function validateDocument(input: DocumentInput): { valid: boolean; error?: string } {
  const { nationality, documentType, documentNumber } = input;
  if (!documentNumber?.trim()) return { valid: false, error: "Document is required" };

  if (nationality === "BR") {
    if (documentType === "CPF") {
      return isValidCPF(documentNumber)
        ? { valid: true }
        : { valid: false, error: "Invalid CPF" };
    }
    if (documentType === "RG") {
      return isValidRG(documentNumber)
        ? { valid: true }
        : { valid: false, error: "Invalid RG" };
    }
    return { valid: false, error: "BR users must provide CPF or RG" };
  }

  if (nationality === "US") {
    if (documentType !== "US_DL") {
      return { valid: false, error: "US users must provide a driver license" };
    }
    return isValidUSDriverLicense(documentNumber)
      ? { valid: true }
      : { valid: false, error: "Invalid US driver license" };
  }

  return { valid: false, error: "Unsupported nationality" };
}
