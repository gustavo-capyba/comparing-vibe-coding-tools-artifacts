import { describe, it, expect } from 'vitest'
import {
  validateCPF,
  validateRG,
  validateDriverLicense,
  validateDocument,
  validateBrazilianPhone,
  validateUSPhone,
  validatePhone,
  validateVehiclePlate,
  formatCPF,
  formatBrazilianPhone,
  formatUSPhone,
  getDocumentTypesForNationality,
} from './validation'

describe('CPF Validation', () => {
  it('should validate correct CPF numbers', () => {
    // Valid CPF numbers (generated test CPFs)
    expect(validateCPF('529.982.247-25')).toBe(true)
    expect(validateCPF('52998224725')).toBe(true)
    expect(validateCPF('111.444.777-35')).toBe(true)
  })

  it('should reject invalid CPF numbers', () => {
    expect(validateCPF('000.000.000-00')).toBe(false)
    expect(validateCPF('111.111.111-11')).toBe(false)
    expect(validateCPF('123.456.789-00')).toBe(false)
    expect(validateCPF('12345678900')).toBe(false)
    expect(validateCPF('1234567890')).toBe(false) // Too short
    expect(validateCPF('123456789012')).toBe(false) // Too long
  })

  it('should handle edge cases', () => {
    expect(validateCPF('')).toBe(false)
    expect(validateCPF('abc.def.ghi-jk')).toBe(false)
    expect(validateCPF('12a.456.789-09')).toBe(false)
  })
})

describe('RG Validation', () => {
  it('should validate correct RG numbers', () => {
    expect(validateRG('12.345.678-9')).toBe(true)
    expect(validateRG('1234567')).toBe(true)
    expect(validateRG('123456789')).toBe(true)
    expect(validateRG('12345678X')).toBe(true)
  })

  it('should reject invalid RG numbers', () => {
    expect(validateRG('123456')).toBe(false) // Too short
    expect(validateRG('1234567890')).toBe(false) // Too long
    expect(validateRG('')).toBe(false)
  })
})

describe('Driver License Validation', () => {
  it('should validate correct driver license numbers', () => {
    expect(validateDriverLicense('A1234567')).toBe(true)
    expect(validateDriverLicense('12345')).toBe(true)
    expect(validateDriverLicense('ABCDEFGHIJKLMNOPQ')).toBe(true) // 17 chars
  })

  it('should reject invalid driver license numbers', () => {
    expect(validateDriverLicense('1234')).toBe(false) // Too short
    expect(validateDriverLicense('ABCDEFGHIJKLMNOPQR')).toBe(false) // 18 chars - too long
    expect(validateDriverLicense('')).toBe(false)
  })
})

describe('Document Validation', () => {
  it('should validate CPF documents', () => {
    expect(validateDocument('CPF', '529.982.247-25')).toEqual({ valid: true })
    expect(validateDocument('CPF', '000.000.000-00')).toEqual({
      valid: false,
      message: 'CPF inválido',
    })
  })

  it('should validate RG documents', () => {
    expect(validateDocument('RG', '12.345.678-9')).toEqual({ valid: true })
    expect(validateDocument('RG', '123456')).toEqual({
      valid: false,
      message: 'RG inválido (deve ter entre 7 e 9 caracteres)',
    })
  })

  it('should validate Driver License documents', () => {
    expect(validateDocument('DRIVER_LICENSE', 'A1234567')).toEqual({ valid: true })
    expect(validateDocument('DRIVER_LICENSE', '1234')).toEqual({
      valid: false,
      message: 'Driver License inválida (deve ter entre 5 e 17 caracteres)',
    })
  })
})

describe('Phone Validation', () => {
  describe('Brazilian Phone', () => {
    it('should validate correct Brazilian phone numbers', () => {
      expect(validateBrazilianPhone('11999999999')).toBe(true) // 11 digits with 9
      expect(validateBrazilianPhone('1199999999')).toBe(true) // 10 digits
      expect(validateBrazilianPhone('(11) 99999-9999')).toBe(true)
      expect(validateBrazilianPhone('(11) 9999-9999')).toBe(true)
    })

    it('should reject invalid Brazilian phone numbers', () => {
      expect(validateBrazilianPhone('123456789')).toBe(false) // Too short
      expect(validateBrazilianPhone('123456789012')).toBe(false) // Too long
    })
  })

  describe('US Phone', () => {
    it('should validate correct US phone numbers', () => {
      expect(validateUSPhone('5551234567')).toBe(true)
      expect(validateUSPhone('(555) 123-4567')).toBe(true)
    })

    it('should reject invalid US phone numbers', () => {
      expect(validateUSPhone('555123456')).toBe(false) // 9 digits
      expect(validateUSPhone('55512345678')).toBe(false) // 11 digits
    })
  })

  describe('Phone by Nationality', () => {
    it('should validate phone based on nationality', () => {
      expect(validatePhone('BR', '11999999999')).toEqual({ valid: true })
      expect(validatePhone('BR', '123456789')).toEqual({
        valid: false,
        message: 'Telefone inválido (deve ter 10-11 dígitos com DDD)',
      })

      expect(validatePhone('US', '5551234567')).toEqual({ valid: true })
      expect(validatePhone('US', '555123456')).toEqual({
        valid: false,
        message: 'Phone number invalid (must have 10 digits)',
      })
    })
  })
})

describe('Vehicle Plate Validation', () => {
  describe('Brazilian Plates', () => {
    it('should validate old format (ABC-1234)', () => {
      expect(validateVehiclePlate('ABC-1234', 'BR')).toEqual({ valid: true })
      expect(validateVehiclePlate('ABC1234', 'BR')).toEqual({ valid: true })
    })

    it('should validate Mercosul format (ABC1D23)', () => {
      expect(validateVehiclePlate('ABC1D23', 'BR')).toEqual({ valid: true })
      expect(validateVehiclePlate('ABC-1D23', 'BR')).toEqual({ valid: true })
    })

    it('should reject invalid Brazilian plates', () => {
      expect(validateVehiclePlate('AB1234', 'BR')).toEqual({
        valid: false,
        message: 'Placa inválida (formato: ABC-1234 ou ABC1D23)',
      })
      expect(validateVehiclePlate('ABCD123', 'BR')).toEqual({
        valid: false,
        message: 'Placa inválida (formato: ABC-1234 ou ABC1D23)',
      })
    })
  })

  describe('US Plates', () => {
    it('should validate US plates', () => {
      expect(validateVehiclePlate('ABC1234', 'US')).toEqual({ valid: true })
      expect(validateVehiclePlate('AB', 'US')).toEqual({ valid: true })
      expect(validateVehiclePlate('ABCDEFG', 'US')).toEqual({ valid: true })
    })

    it('should reject invalid US plates', () => {
      expect(validateVehiclePlate('A', 'US')).toEqual({
        valid: false,
        message: 'Invalid plate (2-7 alphanumeric characters)',
      })
      expect(validateVehiclePlate('ABCDEFGH', 'US')).toEqual({
        valid: false,
        message: 'Invalid plate (2-7 alphanumeric characters)',
      })
    })
  })
})

describe('Formatting Functions', () => {
  it('should format CPF correctly', () => {
    expect(formatCPF('52998224725')).toBe('529.982.247-25')
    expect(formatCPF('529.982.247-25')).toBe('529.982.247-25')
  })

  it('should format Brazilian phone correctly', () => {
    expect(formatBrazilianPhone('11999999999')).toBe('(11) 99999-9999')
    expect(formatBrazilianPhone('1199999999')).toBe('(11) 9999-9999')
  })

  it('should format US phone correctly', () => {
    expect(formatUSPhone('5551234567')).toBe('(555) 123-4567')
  })
})

describe('Document Types for Nationality', () => {
  it('should return BR document types', () => {
    const types = getDocumentTypesForNationality('BR')
    expect(types).toHaveLength(2)
    expect(types).toContainEqual({ value: 'CPF', label: 'CPF' })
    expect(types).toContainEqual({ value: 'RG', label: 'RG' })
  })

  it('should return US document types', () => {
    const types = getDocumentTypesForNationality('US')
    expect(types).toHaveLength(1)
    expect(types).toContainEqual({ value: 'DRIVER_LICENSE', label: "Driver's License" })
  })
})
