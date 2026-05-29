import { describe, it, expect } from 'vitest'
import {
  validateCPF,
  validateRG,
  validateUSID,
  validateDocument,
  validatePhone,
  validateVehiclePlate,
  getDocumentTypes,
  formatDocument,
  formatPhone,
} from '../validation'

describe('CPF Validation', () => {
  it('should validate correct CPFs', () => {
    // Valid CPFs (using valid check digits)
    expect(validateCPF('529.982.247-25')).toBe(true)
    expect(validateCPF('52998224725')).toBe(true)
    expect(validateCPF('111.444.777-35')).toBe(true)
  })

  it('should reject invalid CPFs', () => {
    // All same digits
    expect(validateCPF('111.111.111-11')).toBe(false)
    expect(validateCPF('000.000.000-00')).toBe(false)
    
    // Wrong check digits
    expect(validateCPF('529.982.247-26')).toBe(false)
    expect(validateCPF('123.456.789-00')).toBe(false)
    
    // Wrong length
    expect(validateCPF('12345')).toBe(false)
    expect(validateCPF('123456789012')).toBe(false)
  })

  it('should handle edge cases', () => {
    expect(validateCPF('')).toBe(false)
    expect(validateCPF('abc.def.ghi-jk')).toBe(false)
  })
})

describe('RG Validation', () => {
  it('should validate correct RGs', () => {
    expect(validateRG('12345678')).toBe(true)
    expect(validateRG('123456789')).toBe(true)
    expect(validateRG('1234567')).toBe(true)
    expect(validateRG('12.345.678-9')).toBe(true)
  })

  it('should reject invalid RGs', () => {
    expect(validateRG('123456')).toBe(false)
    expect(validateRG('1234567890')).toBe(false)
    expect(validateRG('')).toBe(false)
  })
})

describe('US ID Validation', () => {
  it('should validate correct US IDs', () => {
    expect(validateUSID('AB123456')).toBe(true)
    expect(validateUSID('12345678')).toBe(true)
    expect(validateUSID('A1B2C3D4E5')).toBe(true)
  })

  it('should reject invalid US IDs', () => {
    expect(validateUSID('ABC')).toBe(false)
    expect(validateUSID('1234567890123')).toBe(false)
    expect(validateUSID('AB@#$%^&')).toBe(false)
    expect(validateUSID('')).toBe(false)
  })
})

describe('validateDocument', () => {
  it('should validate CPF documents', () => {
    const valid = validateDocument('CPF', '529.982.247-25')
    expect(valid.valid).toBe(true)
    expect(valid.message).toBe('')

    const invalid = validateDocument('CPF', '123.456.789-00')
    expect(invalid.valid).toBe(false)
    expect(invalid.message).toBe('CPF inválido')
  })

  it('should validate RG documents', () => {
    const valid = validateDocument('RG', '12345678')
    expect(valid.valid).toBe(true)

    const invalid = validateDocument('RG', '123')
    expect(invalid.valid).toBe(false)
  })

  it('should validate ID documents', () => {
    const valid = validateDocument('ID', 'AB123456')
    expect(valid.valid).toBe(true)

    const invalid = validateDocument('ID', 'ABC')
    expect(invalid.valid).toBe(false)
  })
})

describe('getDocumentTypes', () => {
  it('should return CPF and RG for BR nationality', () => {
    const types = getDocumentTypes('BR')
    expect(types).toContain('CPF')
    expect(types).toContain('RG')
    expect(types).not.toContain('ID')
  })

  it('should return ID for US nationality', () => {
    const types = getDocumentTypes('US')
    expect(types).toContain('ID')
    expect(types).not.toContain('CPF')
    expect(types).not.toContain('RG')
  })
})

describe('Phone Validation', () => {
  it('should validate Brazilian phones', () => {
    expect(validatePhone('11999999999', 'BR')).toBe(true)
    expect(validatePhone('1199999999', 'BR')).toBe(true)
    expect(validatePhone('(11) 99999-9999', 'BR')).toBe(true)
  })

  it('should reject invalid Brazilian phones', () => {
    expect(validatePhone('123456789', 'BR')).toBe(false)
    expect(validatePhone('123456789012', 'BR')).toBe(false)
  })

  it('should validate US phones', () => {
    expect(validatePhone('5551234567', 'US')).toBe(true)
    expect(validatePhone('(555) 123-4567', 'US')).toBe(true)
  })

  it('should reject invalid US phones', () => {
    expect(validatePhone('123456789', 'US')).toBe(false)
    expect(validatePhone('12345678901', 'US')).toBe(false)
  })
})

describe('Vehicle Plate Validation', () => {
  it('should validate Brazilian plates', () => {
    expect(validateVehiclePlate('ABC1234', 'BR')).toBe(true)
    expect(validateVehiclePlate('ABC1D23', 'BR')).toBe(true)
    expect(validateVehiclePlate('abc-1234', 'BR')).toBe(true)
  })

  it('should reject invalid Brazilian plates', () => {
    expect(validateVehiclePlate('AB12345', 'BR')).toBe(false)
    expect(validateVehiclePlate('ABCD123', 'BR')).toBe(false)
    expect(validateVehiclePlate('123ABC4', 'BR')).toBe(false)
  })

  it('should validate US plates', () => {
    expect(validateVehiclePlate('ABC123', 'US')).toBe(true)
    expect(validateVehiclePlate('AB12345', 'US')).toBe(true)
  })

  it('should reject invalid US plates', () => {
    expect(validateVehiclePlate('AB', 'US')).toBe(false)
    expect(validateVehiclePlate('ABCDEFGHI', 'US')).toBe(false)
  })
})

describe('Formatting', () => {
  it('should format CPF', () => {
    expect(formatDocument('52998224725', 'CPF')).toBe('529.982.247-25')
    expect(formatDocument('529982247', 'CPF')).toBe('529.982.247')
  })

  it('should format Brazilian phone', () => {
    expect(formatPhone('11999999999', 'BR')).toBe('(11) 99999-9999')
    expect(formatPhone('1199999999', 'BR')).toBe('(11) 9999-9999')
  })

  it('should format US phone', () => {
    expect(formatPhone('5551234567', 'US')).toBe('(555) 123-4567')
  })
})
