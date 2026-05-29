// Document & misc validation logic. Pure functions — easy to unit test.

export type Nationality = "BR" | "US";
export type DocumentType = "CPF" | "RG" | "DRIVER_LICENSE";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

/** Brazilian CPF: 11 digits, valid check digits. */
export function isValidCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (sliceLen: number) => {
    let sum = 0;
    for (let i = 0; i < sliceLen; i++) sum += parseInt(cpf[i]) * (sliceLen + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(cpf[9]) && calc(10) === parseInt(cpf[10]);
}

/** Brazilian RG: accepts 7-10 alphanumeric chars (states vary). */
export function isValidRG(value: string): boolean {
  const v = value.replace(/[.\-\s]/g, "");
  return /^[0-9A-Za-z]{7,10}$/.test(v);
}

/** Generic US driver license: 5-20 alphanumeric chars. */
export function isValidUSDriverLicense(value: string): boolean {
  const v = value.replace(/\s/g, "");
  return /^[A-Za-z0-9]{5,20}$/.test(v);
}

export function validateDocument(
  nationality: Nationality,
  documentType: DocumentType,
  value: string,
): { valid: boolean; error?: string } {
  if (!value?.trim()) return { valid: false, error: "Document is required" };
  if (nationality === "BR") {
    if (documentType === "CPF")
      return isValidCPF(value)
        ? { valid: true }
        : { valid: false, error: "Invalid CPF" };
    if (documentType === "RG")
      return isValidRG(value)
        ? { valid: true }
        : { valid: false, error: "Invalid RG" };
    return { valid: false, error: "BR users must provide CPF or RG" };
  }
  if (nationality === "US") {
    if (documentType === "DRIVER_LICENSE")
      return isValidUSDriverLicense(value)
        ? { valid: true }
        : { valid: false, error: "Invalid US Driver License" };
    return { valid: false, error: "US users must provide a Driver License" };
  }
  return { valid: false, error: "Unsupported nationality" };
}

export function isValidPhone(value: string): boolean {
  const d = onlyDigits(value);
  return d.length >= 8 && d.length <= 15;
}

export function isValidLicensePlate(value: string): boolean {
  const v = value.replace(/[\s-]/g, "").toUpperCase();
  // BR (Mercosul or old) or US plates: 4-8 alphanumeric
  return /^[A-Z0-9]{4,8}$/.test(v);
}
