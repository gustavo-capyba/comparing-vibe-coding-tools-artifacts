/**
 * Document validation rules by nationality.
 * Isolated and testable — no external dependencies.
 */

export type DocumentType = "cpf" | "rg" | "driver_license";

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/** Validate CPF (Brazilian tax ID): 11 digits, passes check digit algorithm */
export function validateCPF(cpf: string): ValidationResult {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) {
    return { valid: false, error: "CPF must have 11 digits" };
  }
  // All same digits are invalid (e.g. 111.111.111-11)
  if (/^(\d)\1+$/.test(digits)) {
    return { valid: false, error: "CPF cannot be all same digits" };
  }
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) {
    return { valid: false, error: "Invalid CPF" };
  }
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) {
    return { valid: false, error: "Invalid CPF" };
  }
  return { valid: true };
}

/** Validate RG (Brazilian state ID): 7–9 alphanumeric characters */
export function validateRG(rg: string): ValidationResult {
  const cleaned = rg.replace(/[\.\-\/\s]/g, "");
  if (!/^[0-9A-Za-z]{7,9}$/.test(cleaned)) {
    return { valid: false, error: "RG must be 7–9 alphanumeric characters" };
  }
  return { valid: true };
}

/** Validate US driver's license: alphanumeric, 6–16 chars */
export function validateDriverLicense(license: string): ValidationResult {
  const cleaned = license.replace(/[\s\-]/g, "");
  if (!/^[A-Za-z0-9]{6,16}$/.test(cleaned)) {
    return {
      valid: false,
      error: "Driver's license must be 6–16 alphanumeric characters",
    };
  }
  return { valid: true };
}

/**
 * Validate document based on nationality.
 * BR users: must provide cpf or rg.
 * US users: must provide driver_license.
 */
export function validateDocument(
  nationality: string,
  documentType: string,
  documentNumber: string
): ValidationResult {
  const nat = nationality.toUpperCase();

  if (nat === "BR") {
    if (documentType === "cpf") return validateCPF(documentNumber);
    if (documentType === "rg") return validateRG(documentNumber);
    return {
      valid: false,
      error: "BR users must provide cpf or rg",
    };
  }

  if (nat === "US") {
    if (documentType === "driver_license") return validateDriverLicense(documentNumber);
    return {
      valid: false,
      error: "US users must provide driver_license",
    };
  }

  // Other nationalities: accept driver_license
  if (documentType === "driver_license") return validateDriverLicense(documentNumber);
  return { valid: false, error: "Unsupported nationality" };
}
