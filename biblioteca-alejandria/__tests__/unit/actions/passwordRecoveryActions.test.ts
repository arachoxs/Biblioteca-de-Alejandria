import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock recovery service
vi.mock('@/services/auth/recoveryService', () => ({
  sendRecoveryCode: vi.fn(),
  verifyRecoveryCode: vi.fn(),
  resetPassword: vi.fn(),
}));

import {
  sendRecoveryCode,
  verifyRecoveryCode,
  resetPassword,
} from '@/app/(auth)/password-recovery/actions';
import {
  sendRecoveryCode as sendRecoveryCodeService,
  verifyRecoveryCode as verifyRecoveryCodeService,
  resetPassword as resetPasswordService,
} from '@/services/auth/recoveryService';

describe('Password Recovery Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendRecoveryCode', () => {
    it('should return error for empty email', async () => {
      const result = await sendRecoveryCode('');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('correo electrónico es obligatorio');
    });

    it('should return error for whitespace-only email', async () => {
      const result = await sendRecoveryCode('   ');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('correo electrónico es obligatorio');
    });

    it('should return error for invalid email format', async () => {
      const result = await sendRecoveryCode('invalid-email');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('correo');
    });

    it('should sanitize email before sending', async () => {
      vi.mocked(sendRecoveryCodeService).mockResolvedValue({ success: true });

      await sendRecoveryCode('  test@example.com  ');

      expect(sendRecoveryCodeService).toHaveBeenCalledWith('test@example.com');
    });

    it('should call service with valid email', async () => {
      vi.mocked(sendRecoveryCodeService).mockResolvedValue({ success: true });

      const result = await sendRecoveryCode('user@example.com');

      expect(sendRecoveryCodeService).toHaveBeenCalledWith('user@example.com');
      expect(result.success).toBe(true);
    });

    it('should propagate service errors', async () => {
      vi.mocked(sendRecoveryCodeService).mockResolvedValue({
        error: 'Email not found',
      });

      const result = await sendRecoveryCode('notfound@example.com');

      expect(result.error).toBe('Email not found');
    });
  });

  describe('verifyRecoveryCode', () => {
    const validEmail = 'user@example.com';
    const validCode = '12345678';

    it('should return error for empty email or code', async () => {
      const result = await verifyRecoveryCode('', validCode);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('obligatorios');
    });

    it('should return error for empty code', async () => {
      const result = await verifyRecoveryCode(validEmail, '');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('obligatorios');
    });

    it('should return error for code with wrong length', async () => {
      const result = await verifyRecoveryCode(validEmail, '123456'); // 6 digits instead of 8
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('8 dígitos');
    });

    it('should return error for code with non-numeric characters', async () => {
      const result = await verifyRecoveryCode(validEmail, '1234567A');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('numéricos');
    });

    it('should sanitize email before verifying', async () => {
      vi.mocked(verifyRecoveryCodeService).mockResolvedValue({ success: true });

      await verifyRecoveryCode('  user@example.com  ', validCode);

      expect(verifyRecoveryCodeService).toHaveBeenCalledWith('user@example.com', validCode);
    });

    it('should trim code whitespace', async () => {
      vi.mocked(verifyRecoveryCodeService).mockResolvedValue({ success: true });

      await verifyRecoveryCode(validEmail, '  12345678  ');

      expect(verifyRecoveryCodeService).toHaveBeenCalledWith(validEmail, '12345678');
    });

    it('should call service with valid inputs', async () => {
      vi.mocked(verifyRecoveryCodeService).mockResolvedValue({ success: true });

      const result = await verifyRecoveryCode(validEmail, validCode);

      expect(verifyRecoveryCodeService).toHaveBeenCalledWith(validEmail, validCode);
      expect(result.success).toBe(true);
    });

    it('should propagate service errors', async () => {
      vi.mocked(verifyRecoveryCodeService).mockResolvedValue({
        error: 'Invalid or expired code',
      });

      const result = await verifyRecoveryCode(validEmail, validCode);

      expect(result.error).toBe('Invalid or expired code');
    });
  });

  describe('resetPassword', () => {
    const validPassword = 'NewPassword123!';

    it('should return error for empty password', async () => {
      const result = await resetPassword('', validPassword);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('campos de contraseña son obligatorios');
    });

    it('should return error for empty confirmPassword', async () => {
      const result = await resetPassword(validPassword, '');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('campos de contraseña son obligatorios');
    });

    it('should return error when passwords do not match', async () => {
      const result = await resetPassword(validPassword, 'DifferentPassword123!');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('no coinciden');
    });

    it('should return error for weak password', async () => {
      const result = await resetPassword('weak', 'weak');
      expect(result).toHaveProperty('error');
      // Password validation error
    });

    it('should return error for password without uppercase', async () => {
      const result = await resetPassword('password123!', 'password123!');
      expect(result).toHaveProperty('error');
    });

    it('should return error for password without number', async () => {
      const result = await resetPassword('Password!', 'Password!');
      expect(result).toHaveProperty('error');
    });

    it('should return error for password without special character', async () => {
      const result = await resetPassword('Password123', 'Password123');
      expect(result).toHaveProperty('error');
    });

    it('should call service with valid password', async () => {
      vi.mocked(resetPasswordService).mockResolvedValue({ success: true });

      const result = await resetPassword(validPassword, validPassword);

      expect(resetPasswordService).toHaveBeenCalledWith(validPassword);
      expect(result.success).toBe(true);
    });

    it('should propagate service errors', async () => {
      vi.mocked(resetPasswordService).mockResolvedValue({
        error: 'Session expired',
      });

      const result = await resetPassword(validPassword, validPassword);

      expect(result.error).toBe('Session expired');
    });
  });
});
