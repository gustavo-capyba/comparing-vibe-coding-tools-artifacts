import type { DocumentType, Nationality } from './types'

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  
  if (cleaned.length !== 11) return false
  
  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(cleaned)) return false
  
  // Validate first check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[9])) return false
  
  // Validate second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleaned[10])) return false
  
  return true
}

export function validateRG(rg: string): boolean {
  const cleaned = rg.replace(/\D/g, '')
  // RG has 7-9 digits depending on the state
  return cleaned.length >= 7 && cleaned.length <= 9
}

export function validateUSID(id: string): boolean {
  const cleaned = id.replace(/\D/g, '')
  // US ID typically has 8-12 alphanumeric characters
  return id.length >= 8 && id.length <= 12 && /^[A-Za-z0-9]+$/.test(id)
}

export function validateDocument(
  type: DocumentType,
  value: string
): { valid: boolean; message: string } {
  switch (type) {
    case 'CPF':
      return {
        valid: validateCPF(value),
        message: validateCPF(value) ? '' : 'CPF inválido',
      }
    case 'RG':
      return {
        valid: validateRG(value),
        message: validateRG(value) ? '' : 'RG deve ter entre 7 e 9 dígitos',
      }
    case 'ID':
      return {
        valid: validateUSID(value),
        message: validateUSID(value)
          ? ''
          : 'ID deve ter entre 8 e 12 caracteres alfanuméricos',
      }
    default:
      return { valid: false, message: 'Tipo de documento desconhecido' }
  }
}

export function getDocumentTypes(nationality: Nationality): DocumentType[] {
  return nationality === 'BR' ? ['CPF', 'RG'] : ['ID']
}

export function validatePhone(phone: string, nationality: Nationality): boolean {
  const cleaned = phone.replace(/\D/g, '')
  if (nationality === 'BR') {
    // Brazilian phone: 10-11 digits (with area code)
    return cleaned.length >= 10 && cleaned.length <= 11
  } else {
    // US phone: 10 digits
    return cleaned.length === 10
  }
}

export function validateVehiclePlate(plate: string, nationality: Nationality): boolean {
  const cleaned = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (nationality === 'BR') {
    // Brazilian plate: ABC1234 or ABC1D23 (Mercosul)
    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(cleaned)
  } else {
    // US plate: varies by state, typically 6-7 alphanumeric
    return cleaned.length >= 5 && cleaned.length <= 8
  }
}

export function formatDocument(value: string, type: DocumentType): string {
  const cleaned = value.replace(/\D/g, '')
  
  if (type === 'CPF') {
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }
  
  return value
}

export function formatPhone(value: string, nationality: Nationality): string {
  const cleaned = value.replace(/\D/g, '')
  
  if (nationality === 'BR') {
    if (cleaned.length <= 10) {
      return cleaned
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return cleaned
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
  }
  
  return cleaned
    .replace(/(\d{3})(\d)/, '($1) $2')
    .replace(/(\d{3})(\d)/, '$1-$2')
}
