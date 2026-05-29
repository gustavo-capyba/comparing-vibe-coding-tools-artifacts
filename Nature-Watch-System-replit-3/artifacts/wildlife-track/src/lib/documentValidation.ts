export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/[^\d]/g, '');
  return digits.length === 11;
}

export function validateRG(rg: string): boolean {
  const chars = rg.replace(/[^a-zA-Z0-9]/g, '');
  return chars.length >= 7 && chars.length <= 9;
}

export function validateUSDriverLicense(dl: string): boolean {
  const chars = dl.replace(/[^a-zA-Z0-9]/g, '');
  return chars.length >= 8 && chars.length <= 14;
}
