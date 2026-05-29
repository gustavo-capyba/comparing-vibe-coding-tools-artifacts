/**
 * Validação de documentos brasileiros e americanos
 */

// Valida CPF brasileiro
export function validateCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '')
  
  // CPF deve ter 11 dígitos
  if (cleanCPF.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false
  
  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF[9])) return false
  
  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cleanCPF[10])) return false
  
  return true
}

// Valida RG brasileiro (formato simplificado - varia por estado)
export function validateRG(rg: string): boolean {
  // Remove caracteres não alfanuméricos
  const cleanRG = rg.replace(/[^a-zA-Z0-9]/g, '')
  
  // RG deve ter entre 7 e 9 caracteres
  if (cleanRG.length < 7 || cleanRG.length > 9) return false
  
  return true
}

// Valida Driver License americano (formato simplificado)
export function validateDriverLicense(license: string): boolean {
  // Remove espaços
  const cleanLicense = license.trim()
  
  // Driver License deve ter entre 5 e 20 caracteres alfanuméricos
  if (cleanLicense.length < 5 || cleanLicense.length > 20) return false
  
  // Deve conter pelo menos letras ou números
  if (!/^[A-Za-z0-9-]+$/.test(cleanLicense)) return false
  
  return true
}

// Valida telefone brasileiro
export function validateBrazilianPhone(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Aceita formato com DDD (10-11 dígitos)
  if (cleanPhone.length < 10 || cleanPhone.length > 11) return false
  
  return true
}

// Valida telefone americano
export function validateUSPhone(phone: string): boolean {
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Telefone US deve ter 10 dígitos
  if (cleanPhone.length !== 10) return false
  
  return true
}

// Valida placa de veículo brasileira (formatos antigo e Mercosul)
export function validateBrazilianPlate(plate: string): boolean {
  // Remove espaços e traços
  const cleanPlate = plate.replace(/[\s-]/g, '').toUpperCase()
  
  // Formato antigo: ABC-1234 (7 caracteres)
  const oldFormat = /^[A-Z]{3}[0-9]{4}$/
  
  // Formato Mercosul: ABC1D23 (7 caracteres)
  const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
  
  return oldFormat.test(cleanPlate) || mercosulFormat.test(cleanPlate)
}

// Valida placa de veículo americana
export function validateUSPlate(plate: string): boolean {
  // Remove espaços e traços
  const cleanPlate = plate.replace(/[\s-]/g, '').toUpperCase()
  
  // Formato variável: 2-8 caracteres alfanuméricos
  if (cleanPlate.length < 2 || cleanPlate.length > 8) return false
  
  return /^[A-Z0-9]+$/.test(cleanPlate)
}

// Tipos de documento por nacionalidade
export type Nationality = 'BR' | 'US'

export interface DocumentValidationResult {
  isValid: boolean
  error?: string
}

// Valida documento baseado na nacionalidade e tipo
export function validateDocument(
  nationality: Nationality,
  documentType: string,
  documentNumber: string
): DocumentValidationResult {
  if (nationality === 'BR') {
    if (documentType === 'CPF') {
      return {
        isValid: validateCPF(documentNumber),
        error: validateCPF(documentNumber) ? undefined : 'CPF inválido',
      }
    }
    if (documentType === 'RG') {
      return {
        isValid: validateRG(documentNumber),
        error: validateRG(documentNumber) ? undefined : 'RG inválido',
      }
    }
  }
  
  if (nationality === 'US') {
    if (documentType === 'DRIVER_LICENSE') {
      return {
        isValid: validateDriverLicense(documentNumber),
        error: validateDriverLicense(documentNumber) 
          ? undefined 
          : 'Driver License inválida',
      }
    }
  }
  
  return { isValid: false, error: 'Tipo de documento inválido' }
}

// Valida telefone baseado na nacionalidade
export function validatePhone(
  nationality: Nationality,
  phone: string
): DocumentValidationResult {
  if (nationality === 'BR') {
    return {
      isValid: validateBrazilianPhone(phone),
      error: validateBrazilianPhone(phone) 
        ? undefined 
        : 'Telefone inválido. Use o formato (XX) XXXXX-XXXX',
    }
  }
  
  if (nationality === 'US') {
    return {
      isValid: validateUSPhone(phone),
      error: validateUSPhone(phone) 
        ? undefined 
        : 'Phone inválido. Use o formato (XXX) XXX-XXXX',
    }
  }
  
  return { isValid: false, error: 'Nacionalidade inválida' }
}

// Valida placa de veículo baseado na nacionalidade
export function validatePlate(
  nationality: Nationality,
  plate: string
): DocumentValidationResult {
  if (nationality === 'BR') {
    return {
      isValid: validateBrazilianPlate(plate),
      error: validateBrazilianPlate(plate) 
        ? undefined 
        : 'Placa inválida. Use o formato ABC-1234 ou ABC1D23',
    }
  }
  
  if (nationality === 'US') {
    return {
      isValid: validateUSPlate(plate),
      error: validateUSPlate(plate) 
        ? undefined 
        : 'Placa inválida',
    }
  }
  
  return { isValid: false, error: 'Nacionalidade inválida' }
}
