import { z } from "zod";

// BR CPF Validation
function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  
  let soma = 0;
  for (let i = 1; i <= 9; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;

  soma = 0;
  for (let i = 1; i <= 10; i++) {
    soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(10, 11))) return false;

  return true;
}

// BR RG Validation (rough format check)
function validateRG(rg: string): boolean {
  const clean = rg.replace(/[^\dXx]+/g, '');
  return clean.length >= 7 && clean.length <= 9;
}

// US Driver License Validation (rough format check)
function validateUSDL(dl: string): boolean {
  const clean = dl.replace(/[^a-zA-Z0-9]+/g, '');
  return clean.length >= 5 && clean.length <= 20;
}

export function validateDocument(nationality: "BR" | "US", docType: string, docValue: string): boolean {
  if (nationality === "BR") {
    if (docType === "CPF") return validateCPF(docValue);
    if (docType === "RG") return validateRG(docValue);
  } else if (nationality === "US") {
    return validateUSDL(docValue);
  }
  return false;
}
