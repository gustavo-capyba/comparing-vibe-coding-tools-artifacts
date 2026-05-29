// Document validation per nationality.
// BR: CPF (11 digits with checksum) or RG (7-10 alphanumeric).
// US: Driver License (5-20 alphanumeric, allow dashes).

export type Nationality = "BR" | "US";

export function sanitizeDigits(s: string) {
  return s.replace(/\D/g, "");
}

export function isValidCPF(input: string): boolean {
  const cpf = sanitizeDigits(input);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += parseInt(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === parseInt(cpf[9]) && calc(10) === parseInt(cpf[10]);
}

export function isValidRG(input: string): boolean {
  const rg = input.replace(/[^0-9A-Za-z]/g, "");
  return rg.length >= 7 && rg.length <= 10;
}

export function isValidUSLicense(input: string): boolean {
  const v = input.replace(/[^0-9A-Za-z-]/g, "");
  return v.length >= 5 && v.length <= 20;
}

export type DocType = "CPF" | "RG" | "DL";

export function validateDocument(
  nationality: Nationality,
  docType: DocType,
  value: string,
): { ok: true } | { ok: false; error: string } {
  if (nationality === "BR") {
    if (docType === "CPF")
      return isValidCPF(value) ? { ok: true } : { ok: false, error: "Invalid CPF" };
    if (docType === "RG")
      return isValidRG(value) ? { ok: true } : { ok: false, error: "Invalid RG" };
    return { ok: false, error: "BR users must provide CPF or RG" };
  }
  if (nationality === "US") {
    if (docType === "DL")
      return isValidUSLicense(value)
        ? { ok: true }
        : { ok: false, error: "Invalid driver license" };
    return { ok: false, error: "US users must provide a driver license" };
  }
  return { ok: false, error: "Unsupported nationality" };
}

const PHONE_RE = /^\+?[0-9\s\-()]{8,20}$/;
export function isValidPhone(s: string) {
  return PHONE_RE.test(s);
}

export function isValidPlate(s: string) {
  const v = s.replace(/[^0-9A-Za-z]/g, "");
  return v.length >= 4 && v.length <= 10;
}