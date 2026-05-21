import type { DocumentType, Nationality } from './types'

/**
 * Validates a Brazilian CPF number
 */
export function validateCPF(cpf: string): boolean {
  // Remove non-numeric characters
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // CPF must have 11 digits
  if (cleanCPF.length !== 11) return false
  
  // Check for known invalid CPFs (all same digits)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validate first check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF[9])) return false
  
  // Validate second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF[10])) return false
  
  return true
}

/**
 * Validates a Brazilian RG number (simplified validation)
 */
export function validateRG(rg: string): boolean {
  // Remove non-alphanumeric characters
  const cleanRG = rg.replace(/[^a-zA-Z0-9]/g, '')
  
  // RG must have between 7 and 9 characters
  return cleanRG.length >= 7 && cleanRG.length <= 9
}

/**
 * Validates a US Driver License (simplified validation)
 */
export function validateDriverLicense(license: string): boolean {
  // Remove non-alphanumeric characters
  const cleanLicense = license.replace(/[^a-zA-Z0-9]/g, '')
  
  // Driver license must have between 5 and 17 characters
  return cleanLicense.length >= 5 && cleanLicense.length <= 17
}

/**
 * Validates a document based on its type
 */
export function validateDocument(type: DocumentType, number: string): { valid: boolean; message?: string } {
  switch (type) {
    case 'CPF':
      if (!validateCPF(number)) {
        return { valid: false, message: 'CPF inválido' }
      }
      break
    case 'RG':
      if (!validateRG(number)) {
        return { valid: false, message: 'RG inválido (deve ter entre 7 e 9 caracteres)' }
      }
      break
    case 'DRIVER_LICENSE':
      if (!validateDriverLicense(number)) {
        return { valid: false, message: 'Driver License inválida (deve ter entre 5 e 17 caracteres)' }
      }
      break
  }
  return { valid: true }
}

/**
 * Validates a Brazilian phone number
 */
export function validateBrazilianPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '')
  // Brazilian phone: 10-11 digits (with area code)
  return cleanPhone.length >= 10 && cleanPhone.length <= 11
}

/**
 * Validates a US phone number
 */
export function validateUSPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '')
  // US phone: 10 digits
  return cleanPhone.length === 10
}

/**
 * Validates a phone number based on nationality
 */
export function validatePhone(nationality: Nationality, phone: string): { valid: boolean; message?: string } {
  if (nationality === 'BR') {
    if (!validateBrazilianPhone(phone)) {
      return { valid: false, message: 'Telefone inválido (deve ter 10-11 dígitos com DDD)' }
    }
  } else {
    if (!validateUSPhone(phone)) {
      return { valid: false, message: 'Phone number invalid (must have 10 digits)' }
    }
  }
  return { valid: true }
}

/**
 * Validates a vehicle plate (Brazilian or US format)
 */
export function validateVehiclePlate(plate: string, nationality: Nationality): { valid: boolean; message?: string } {
  const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  
  if (nationality === 'BR') {
    // Brazilian plates: ABC-1234 (old) or ABC1D23 (Mercosul)
    const oldFormat = /^[A-Z]{3}[0-9]{4}$/.test(cleanPlate)
    const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(cleanPlate)
    if (!oldFormat && !mercosulFormat) {
      return { valid: false, message: 'Placa inválida (formato: ABC-1234 ou ABC1D23)' }
    }
  } else {
    // US plates: generally 2-7 alphanumeric characters
    if (cleanPlate.length < 2 || cleanPlate.length > 7) {
      return { valid: false, message: 'Invalid plate (2-7 alphanumeric characters)' }
    }
  }
  
  return { valid: true }
}

/**
 * Formats a CPF number
 */
export function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '')
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formats a Brazilian phone number
 */
export function formatBrazilianPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
}

/**
 * Formats a US phone number
 */
export function formatUSPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
}

/**
 * Get document types available for a nationality
 */
export function getDocumentTypesForNationality(nationality: Nationality): { value: DocumentType; label: string }[] {
  if (nationality === 'BR') {
    return [
      { value: 'CPF', label: 'CPF' },
      { value: 'RG', label: 'RG' },
    ]
  }
  return [
    { value: 'DRIVER_LICENSE', label: "Driver's License" },
  ]
}
