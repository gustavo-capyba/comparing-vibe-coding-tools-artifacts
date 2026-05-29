import { describe, it, expect } from 'vitest';
import { validateCPF, validateRG, validateUSDriverLicense } from './documentValidation';

describe('Document Validation', () => {
  describe('validateCPF', () => {
    it('returns true for 11 digits', () => {
      expect(validateCPF('12345678901')).toBe(true);
      expect(validateCPF('123.456.789-01')).toBe(true);
    });
    it('returns false for invalid length', () => {
      expect(validateCPF('1234567890')).toBe(false);
      expect(validateCPF('123456789012')).toBe(false);
    });
  });

  describe('validateRG', () => {
    it('returns true for 7-9 alphanumeric chars', () => {
      expect(validateRG('1234567')).toBe(true);
      expect(validateRG('123456789')).toBe(true);
      expect(validateRG('12.345.678-X')).toBe(true);
    });
    it('returns false for invalid length', () => {
      expect(validateRG('123456')).toBe(false);
      expect(validateRG('1234567890')).toBe(false);
    });
  });

  describe('validateUSDriverLicense', () => {
    it('returns true for 8-14 alphanumeric chars', () => {
      expect(validateUSDriverLicense('12345678')).toBe(true);
      expect(validateUSDriverLicense('D12345678')).toBe(true);
      expect(validateUSDriverLicense('A1234567890123')).toBe(true);
    });
    it('returns false for invalid length', () => {
      expect(validateUSDriverLicense('1234567')).toBe(false);
      expect(validateUSDriverLicense('123456789012345')).toBe(false);
    });
  });
});
