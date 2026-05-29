import { describe, it, expect } from 'vitest'
import {
  validateCPF,
  validateRG,
  validateDriverLicense,
  validateBrazilianPhone,
  validateUSPhone,
  validateBrazilianPlate,
  validateUSPlate,
  validateDocument,
  validatePhone,
  validatePlate,
} from '../documents'

describe('Validação de Documentos Brasileiros', () => {
  describe('validateCPF', () => {
    it('deve aceitar CPF válido', () => {
      // CPFs válidos para teste
      expect(validateCPF('529.982.247-25')).toBe(true)
      expect(validateCPF('52998224725')).toBe(true)
      expect(validateCPF('111.444.777-35')).toBe(true)
    })

    it('deve rejeitar CPF inválido', () => {
      expect(validateCPF('111.111.111-11')).toBe(false) // Todos iguais
      expect(validateCPF('000.000.000-00')).toBe(false) // Todos zeros
      expect(validateCPF('123.456.789-00')).toBe(false) // Dígitos inválidos
      expect(validateCPF('12345678900')).toBe(false) // Dígitos inválidos
    })

    it('deve rejeitar CPF com tamanho incorreto', () => {
      expect(validateCPF('123456789')).toBe(false) // Muito curto
      expect(validateCPF('1234567890123')).toBe(false) // Muito longo
    })
  })

  describe('validateRG', () => {
    it('deve aceitar RG válido', () => {
      expect(validateRG('12.345.678-9')).toBe(true)
      expect(validateRG('123456789')).toBe(true)
      expect(validateRG('1234567')).toBe(true)
      expect(validateRG('12345678X')).toBe(true) // RG pode ter X
    })

    it('deve rejeitar RG inválido', () => {
      expect(validateRG('123456')).toBe(false) // Muito curto
      expect(validateRG('1234567890')).toBe(false) // Muito longo
    })
  })

  describe('validateBrazilianPhone', () => {
    it('deve aceitar telefone brasileiro válido', () => {
      expect(validateBrazilianPhone('(11) 99999-9999')).toBe(true)
      expect(validateBrazilianPhone('11999999999')).toBe(true)
      expect(validateBrazilianPhone('(11) 3333-3333')).toBe(true)
      expect(validateBrazilianPhone('1133333333')).toBe(true)
    })

    it('deve rejeitar telefone brasileiro inválido', () => {
      expect(validateBrazilianPhone('123456789')).toBe(false) // Muito curto
      expect(validateBrazilianPhone('123456789012')).toBe(false) // Muito longo
    })
  })

  describe('validateBrazilianPlate', () => {
    it('deve aceitar placa brasileira formato antigo', () => {
      expect(validateBrazilianPlate('ABC-1234')).toBe(true)
      expect(validateBrazilianPlate('ABC1234')).toBe(true)
      expect(validateBrazilianPlate('abc-1234')).toBe(true)
    })

    it('deve aceitar placa brasileira formato Mercosul', () => {
      expect(validateBrazilianPlate('ABC1D23')).toBe(true)
      expect(validateBrazilianPlate('ABC-1D23')).toBe(true)
    })

    it('deve rejeitar placa brasileira inválida', () => {
      expect(validateBrazilianPlate('AB12345')).toBe(false)
      expect(validateBrazilianPlate('ABCD1234')).toBe(false)
      expect(validateBrazilianPlate('ABC123')).toBe(false)
    })
  })
})

describe('Validação de Documentos Americanos', () => {
  describe('validateDriverLicense', () => {
    it('deve aceitar Driver License válida', () => {
      expect(validateDriverLicense('A1234567')).toBe(true)
      expect(validateDriverLicense('12345678')).toBe(true)
      expect(validateDriverLicense('AB-1234567890')).toBe(true)
    })

    it('deve rejeitar Driver License inválida', () => {
      expect(validateDriverLicense('ABC')).toBe(false) // Muito curto
      expect(validateDriverLicense('ABC@#$%')).toBe(false) // Caracteres inválidos
    })
  })

  describe('validateUSPhone', () => {
    it('deve aceitar telefone americano válido', () => {
      expect(validateUSPhone('(555) 123-4567')).toBe(true)
      expect(validateUSPhone('5551234567')).toBe(true)
      expect(validateUSPhone('555-123-4567')).toBe(true)
    })

    it('deve rejeitar telefone americano inválido', () => {
      expect(validateUSPhone('123456789')).toBe(false) // 9 dígitos
      expect(validateUSPhone('12345678901')).toBe(false) // 11 dígitos
    })
  })

  describe('validateUSPlate', () => {
    it('deve aceitar placa americana válida', () => {
      expect(validateUSPlate('ABC1234')).toBe(true)
      expect(validateUSPlate('AB12345')).toBe(true)
      expect(validateUSPlate('12ABC34')).toBe(true)
    })

    it('deve rejeitar placa americana inválida', () => {
      expect(validateUSPlate('A')).toBe(false) // Muito curto
      expect(validateUSPlate('ABCDEFGHI')).toBe(false) // Muito longo
      expect(validateUSPlate('ABC@123')).toBe(false) // Caractere inválido
    })
  })
})

describe('Funções de Validação Combinadas', () => {
  describe('validateDocument', () => {
    it('deve validar documento brasileiro corretamente', () => {
      expect(validateDocument('BR', 'CPF', '529.982.247-25').isValid).toBe(true)
      expect(validateDocument('BR', 'CPF', '123.456.789-00').isValid).toBe(false)
      expect(validateDocument('BR', 'RG', '12345678').isValid).toBe(true)
    })

    it('deve validar documento americano corretamente', () => {
      expect(validateDocument('US', 'DRIVER_LICENSE', 'A1234567').isValid).toBe(true)
      expect(validateDocument('US', 'DRIVER_LICENSE', 'AB').isValid).toBe(false)
    })

    it('deve retornar erro para tipo de documento inválido', () => {
      const result = validateDocument('BR', 'INVALID', '12345')
      expect(result.isValid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('validatePhone', () => {
    it('deve validar telefone por nacionalidade', () => {
      expect(validatePhone('BR', '11999999999').isValid).toBe(true)
      expect(validatePhone('US', '5551234567').isValid).toBe(true)
    })
  })

  describe('validatePlate', () => {
    it('deve validar placa por nacionalidade', () => {
      expect(validatePlate('BR', 'ABC-1234').isValid).toBe(true)
      expect(validatePlate('US', 'ABC1234').isValid).toBe(true)
    })
  })
})
