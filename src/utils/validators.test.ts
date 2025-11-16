/**
 * Validators Tests
 *
 * Purpose: Tests Italian data validators (Codice Fiscale, email, phone)
 * Coverage: All validation functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateCodiceFiscale,
  validateEmail,
  validatePhone,
  validatePartecipante,
} from './validators';

describe('validators', () => {
  describe('validateCodiceFiscale', () => {
    it('should accept valid Codice Fiscale', () => {
      const validCodes = [
        'RSSMRA80A01H501Z',
        'BNCLRA85B42H501W',
        'VRDGNN70C01H501X',
        'MROLND75D15H501K',
      ];

      validCodes.forEach((code) => {
        expect(validateCodiceFiscale(code)).toBe(true);
      });
    });

    it('should accept lowercase Codice Fiscale', () => {
      expect(validateCodiceFiscale('rssmra80a01h501z')).toBe(true);
      expect(validateCodiceFiscale('BnClRa85B42H501W')).toBe(true);
    });

    it('should reject invalid format', () => {
      const invalidCodes = [
        'RSSMRA80A01H501', // Too short
        'RSSMRA80A01H501ZZ', // Too long
        '1SSMRA80A01H501Z', // Starts with number
        'RSSMRA80A01H5012', // Ends with number
        'RSS MRA80A01H501Z', // Contains space
        'RSSMRA-80A01H501Z', // Contains dash
        '', // Empty string
      ];

      invalidCodes.forEach((code) => {
        expect(validateCodiceFiscale(code)).toBe(false);
      });
    });

    it('should reject null and undefined', () => {
      expect(validateCodiceFiscale(null as any)).toBe(false);
      expect(validateCodiceFiscale(undefined as any)).toBe(false);
    });

    it('should reject completely wrong format', () => {
      expect(validateCodiceFiscale('1234567890123456')).toBe(false);
      expect(validateCodiceFiscale('ABCDEFGHILMNOPQR')).toBe(false);
      expect(validateCodiceFiscale('test@example.com')).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user_123@test-domain.com',
        'a@b.c',
      ];

      validEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com', // Space
        'user@.com',
        'user@domain',
        '',
        'user@domain..com',
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should reject null and undefined', () => {
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('user@localhost')).toBe(true); // Technically valid
      expect(validateEmail('user..name@example.com')).toBe(true); // Accepts double dots
      expect(validateEmail('user@sub.domain.example.com')).toBe(true); // Subdomain
    });
  });

  describe('validatePhone', () => {
    it('should accept valid Italian phone numbers', () => {
      const validPhones = [
        '3331234567', // Mobile without leading 0
        '0331234567', // Mobile with leading 0
        '0512345678', // Landline
        '333 123 4567', // With spaces
        '333-123-4567', // With dashes
        '333 123-4567', // Mixed separators
      ];

      validPhones.forEach((phone) => {
        expect(validatePhone(phone)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123', // Too short
        '12345678901', // Too long
        'abcdefghij', // Letters
        '+393331234567', // International format (not supported)
        '',
        '333 123 456', // Too few digits even with separators
      ];

      invalidPhones.forEach((phone) => {
        expect(validatePhone(phone)).toBe(false);
      });
    });

    it('should reject null and undefined', () => {
      expect(validatePhone(null as any)).toBe(false);
      expect(validatePhone(undefined as any)).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      expect(validatePhone('333 123 4567')).toBe(true);
      expect(validatePhone('  3331234567  ')).toBe(false); // Leading/trailing spaces not cleaned
      expect(validatePhone('3 3 3 1 2 3 4 5 6 7')).toBe(true); // Spaces everywhere
    });
  });

  describe('validatePartecipante', () => {
    it('should validate all fields for valid participant', () => {
      const participant = {
        codice_fiscale: 'RSSMRA80A01H501Z',
        email: 'mario.rossi@example.com',
        telefono: '3331234567',
      };

      const result = validatePartecipante(participant);

      expect(result.cf_valid).toBe(true);
      expect(result.email_valid).toBe(true);
      expect(result.phone_valid).toBe(true);
    });

    it('should detect invalid Codice Fiscale', () => {
      const participant = {
        codice_fiscale: 'INVALID',
        email: 'mario.rossi@example.com',
        telefono: '3331234567',
      };

      const result = validatePartecipante(participant);

      expect(result.cf_valid).toBe(false);
      expect(result.email_valid).toBe(true);
      expect(result.phone_valid).toBe(true);
    });

    it('should detect invalid email', () => {
      const participant = {
        codice_fiscale: 'RSSMRA80A01H501Z',
        email: 'invalid-email',
        telefono: '3331234567',
      };

      const result = validatePartecipante(participant);

      expect(result.cf_valid).toBe(true);
      expect(result.email_valid).toBe(false);
      expect(result.phone_valid).toBe(true);
    });

    it('should detect invalid phone', () => {
      const participant = {
        codice_fiscale: 'RSSMRA80A01H501Z',
        email: 'mario.rossi@example.com',
        telefono: '123',
      };

      const result = validatePartecipante(participant);

      expect(result.cf_valid).toBe(true);
      expect(result.email_valid).toBe(true);
      expect(result.phone_valid).toBe(false);
    });

    it('should handle missing fields', () => {
      const participant = {};

      const result = validatePartecipante(participant);

      expect(result.cf_valid).toBe(false);
      expect(result.email_valid).toBe(false);
      expect(result.phone_valid).toBe(false);
    });

    it('should handle partial participant data', () => {
      const participant = {
        codice_fiscale: 'RSSMRA80A01H501Z',
      };

      const result = validatePartecipante(participant);

      expect(result.cf_valid).toBe(true);
      expect(result.email_valid).toBe(false);
      expect(result.phone_valid).toBe(false);
    });

    it('should handle all invalid fields', () => {
      const participant = {
        codice_fiscale: 'INVALID',
        email: 'not-an-email',
        telefono: '123',
      };

      const result = validatePartecipante(participant);

      expect(result.cf_valid).toBe(false);
      expect(result.email_valid).toBe(false);
      expect(result.phone_valid).toBe(false);
    });

    it('should treat empty strings as invalid', () => {
      const participant = {
        codice_fiscale: '',
        email: '',
        telefono: '',
      };

      const result = validatePartecipante(participant);

      expect(result.cf_valid).toBe(false);
      expect(result.email_valid).toBe(false);
      expect(result.phone_valid).toBe(false);
    });
  });

  describe('Edge cases and special scenarios', () => {
    it('should handle Unicode characters in Codice Fiscale', () => {
      expect(validateCodiceFiscale('RSSMRÀ80A01H501Z')).toBe(false);
      expect(validateCodiceFiscale('RSSMRA80A01H501ž')).toBe(false);
    });

    it('should handle special characters in email', () => {
      expect(validateEmail('user+filter@example.com')).toBe(true);
      expect(validateEmail('user_name@example.com')).toBe(true);
      expect(validateEmail('user.name@example.com')).toBe(true);
      expect(validateEmail('user#name@example.com')).toBe(false);
    });

    it('should handle international phone formats', () => {
      // Our validator only supports Italian domestic format
      expect(validatePhone('+39 333 1234567')).toBe(false);
      expect(validatePhone('0039 333 1234567')).toBe(false);
    });

    it('should handle extremely long inputs', () => {
      const longString = 'A'.repeat(1000);
      expect(validateCodiceFiscale(longString)).toBe(false);
      expect(validateEmail(longString + '@example.com')).toBe(false);
      expect(validatePhone(longString)).toBe(false);
    });
  });
});
