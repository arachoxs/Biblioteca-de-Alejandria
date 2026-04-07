import { describe, it, expect } from 'vitest';
import { isPasswordValid, validatePasswords } from '@/lib/validations/auth';
import { PASSWORD_MIN_LENGTH } from '@/lib/validations/rules';

// ─── isPasswordValid ───────────────────────────────────────────────

describe('isPasswordValid', () => {
  describe('valid passwords', () => {
    it.each([
      ['SecurePass123!'],
      ['MyP@ssw0rd1234'],
      ['ComplexPass1!'],
      ['ValidPassword1'],
      ['Test12345678!'],
    ])('should return true for valid password: %s', (password) => {
      expect(isPasswordValid(password)).toBe(true);
    });
  });

  describe('invalid passwords', () => {
    it('should return false for empty password', () => {
      expect(isPasswordValid('')).toBe(false);
    });

    it('should return false for password too short', () => {
      expect(isPasswordValid('Short1!')).toBe(false);
    });

    it('should return false for password missing lowercase', () => {
      expect(isPasswordValid('SECUREPASS123!')).toBe(false);
    });

    it('should return false for password missing uppercase', () => {
      expect(isPasswordValid('securepass123!')).toBe(false);
    });

    it('should return false for password missing digit/special char', () => {
      expect(isPasswordValid('SecurePassword')).toBe(false);
    });

    it('should return false for password with spaces', () => {
      expect(isPasswordValid('Secure Pass123!')).toBe(false);
    });
  });

  describe('boundary conditions', () => {
    it('should return true for password at minimum length (12 chars)', () => {
      expect(isPasswordValid('SecurePas12!')).toBe(true);
    });

    it('should return false for password one char below minimum', () => {
      expect(isPasswordValid('SecurePas1!')).toBe(false);
    });
  });
});

// ─── validatePasswords ─────────────────────────────────────────────

describe('validatePasswords', () => {
  describe('without useIndicator flag (default)', () => {
    it('should return null for valid matching passwords', () => {
      const result = validatePasswords('SecurePass123!', 'SecurePass123!');
      expect(result).toBeNull();
    });

    it('should return error for empty password', () => {
      const result = validatePasswords('', '');
      expect(result).not.toBeNull();
      expect(result?.contrasena).toBe('La contraseña es obligatoria.');
    });

    it('should return error for password too short', () => {
      const result = validatePasswords('Short1!', 'Short1!');
      expect(result).not.toBeNull();
      expect(result?.contrasena).toBe(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
    });

    it('should return error for password missing lowercase', () => {
      const result = validatePasswords('SECUREPASS123!', 'SECUREPASS123!');
      expect(result).not.toBeNull();
      expect(result?.contrasena).toBe('La contraseña debe contener al menos una letra minúscula.');
    });

    it('should return error for password missing uppercase', () => {
      const result = validatePasswords('securepass123!', 'securepass123!');
      expect(result).not.toBeNull();
      expect(result?.contrasena).toBe('La contraseña debe contener al menos una letra mayúscula.');
    });

    it('should return error for password missing digit/special char', () => {
      const result = validatePasswords('SecurePassword', 'SecurePassword');
      expect(result).not.toBeNull();
      expect(result?.contrasena).toBe('La contraseña debe contener al menos un dígito o carácter especial.');
    });

    it('should return error for password with spaces', () => {
      const result = validatePasswords('Secure Pass123!', 'Secure Pass123!');
      expect(result).not.toBeNull();
      expect(result?.contrasena).toBe('La contraseña no puede contener espacios en blanco.');
    });

    it('should return error for mismatched passwords', () => {
      const result = validatePasswords('SecurePass123!', 'DifferentPass123!');
      expect(result).not.toBeNull();
      expect(result?.confirmar_contrasena).toBe('Las contraseñas no coinciden.');
    });

    it('should return error for empty confirmation', () => {
      const result = validatePasswords('SecurePass123!', '');
      expect(result).not.toBeNull();
      expect(result?.confirmar_contrasena).toBe('Confirmar contraseña es obligatorio.');
    });

    it('should return multiple errors when both fields are invalid', () => {
      const result = validatePasswords('', '');
      expect(result).not.toBeNull();
      expect(result?.contrasena).toBeDefined();
      expect(result?.confirmar_contrasena).toBeDefined();
    });
  });

  describe('with useIndicator flag', () => {
    it('should not validate main password when useIndicator is true', () => {
      // Invalid password but useIndicator=true skips main password validation
      // Since passwords match and only confirmation is validated, result is null
      const result = validatePasswords('short', 'short', true);
      // When passwords match and useIndicator=true, no errors are generated
      // because main password validation is skipped
      expect(result).toBeNull();
    });

    it('should skip main password error but validate mismatch when useIndicator is true', () => {
      const result = validatePasswords('short', 'different', true);
      expect(result).not.toBeNull();
      // Should NOT have contrasena error because useIndicator=true
      expect(result?.contrasena).toBeUndefined();
      // Should have confirmar_contrasena error for mismatch
      expect(result?.confirmar_contrasena).toBe('Las contraseñas no coinciden.');
    });

    it('should still validate confirmation password when useIndicator is true', () => {
      const result = validatePasswords('SecurePass123!', '', true);
      expect(result).not.toBeNull();
      expect(result?.confirmar_contrasena).toBe('Confirmar contraseña es obligatorio.');
    });

    it('should still check password match when useIndicator is true', () => {
      const result = validatePasswords('SecurePass123!', 'DifferentPass456!', true);
      expect(result).not.toBeNull();
      expect(result?.confirmar_contrasena).toBe('Las contraseñas no coinciden.');
    });

    it('should return null when passwords match and useIndicator is true', () => {
      // Even with invalid main password, if confirmation matches, only confirmar error matters
      // But since they match, no confirmar error
      const result = validatePasswords('ValidPass123!', 'ValidPass123!', true);
      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle whitespace-only password', () => {
      const result = validatePasswords('   ', '   ');
      expect(result).not.toBeNull();
      expect(result?.contrasena).toBe('La contraseña no puede contener espacios.');
    });

    it('should handle password at minimum length boundary', () => {
      const result = validatePasswords('SecurePas12!', 'SecurePas12!');
      expect(result).toBeNull();
    });

    it('should handle password one below minimum length', () => {
      const result = validatePasswords('SecurePas1!', 'SecurePas1!');
      expect(result).not.toBeNull();
      expect(result?.contrasena).toBe(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
    });
  });
});
