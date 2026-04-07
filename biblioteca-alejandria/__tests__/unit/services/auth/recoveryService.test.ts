import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/models/authModel');

import {
  sendRecoveryCode as sendRecoveryCodeModel,
  verifyRecoveryCode as verifyRecoveryCodeModel,
  resetPassword as resetPasswordModel,
} from '@/models/authModel';
import {
  sendRecoveryCode,
  verifyRecoveryCode,
  resetPassword,
} from '@/services/auth/recoveryService';

describe('recoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── sendRecoveryCode ──────────────────────────────────────────────

  describe('sendRecoveryCode', () => {
    it('should delegate to model sendRecoveryCode', async () => {
      vi.mocked(sendRecoveryCodeModel).mockResolvedValue({
        success: true,
        message: 'Si el correo está registrado, recibirás un código de recuperación.',
      });

      const result = await sendRecoveryCode('user@example.com');

      expect(sendRecoveryCodeModel).toHaveBeenCalledWith('user@example.com');
      expect(result.success).toBe(true);
      expect(result.message).toContain('código de recuperación');
    });

    it('should propagate error response from model', async () => {
      vi.mocked(sendRecoveryCodeModel).mockResolvedValue({
        error: 'Tu cuenta ha sido deshabilitada.',
      });

      const result = await sendRecoveryCode('banned@example.com');

      expect(result.error).toContain('deshabilitada');
    });
  });

  // ─── verifyRecoveryCode ────────────────────────────────────────────

  describe('verifyRecoveryCode', () => {
    it('should delegate to model verifyRecoveryCode', async () => {
      vi.mocked(verifyRecoveryCodeModel).mockResolvedValue({
        success: true,
        message: 'Código verificado correctamente.',
      });

      const result = await verifyRecoveryCode('user@example.com', '123456');

      expect(verifyRecoveryCodeModel).toHaveBeenCalledWith('user@example.com', '123456');
      expect(result.success).toBe(true);
      expect(result.message).toContain('verificado');
    });

    it('should propagate incorrect code error from model', async () => {
      vi.mocked(verifyRecoveryCodeModel).mockResolvedValue({
        error: 'El código ingresado es incorrecto.',
      });

      const result = await verifyRecoveryCode('user@example.com', 'wrongcode');

      expect(result.error).toContain('incorrecto');
    });

    it('should propagate expired code error from model', async () => {
      vi.mocked(verifyRecoveryCodeModel).mockResolvedValue({
        error: 'No se pudo validar el código ingresado.',
      });

      const result = await verifyRecoveryCode('user@example.com', 'expiredcode');

      expect(result.error).toContain('No se pudo validar');
    });
  });

  // ─── resetPassword ─────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('should delegate to model resetPassword', async () => {
      vi.mocked(resetPasswordModel).mockResolvedValue({
        success: true,
        message: 'Contraseña actualizada exitosamente.',
      });

      const result = await resetPassword('NewSecurePassword123!');

      expect(resetPasswordModel).toHaveBeenCalledWith('NewSecurePassword123!');
      expect(result.success).toBe(true);
      expect(result.message).toContain('actualizada');
    });

    it('should propagate session expired error from model', async () => {
      vi.mocked(resetPasswordModel).mockResolvedValue({
        error: 'Tu sesión ha expirado. Por favor, solicita un nuevo código.',
      });

      const result = await resetPassword('NewPassword');

      expect(result.error).toContain('expirado');
    });

    it('should propagate update failure error from model', async () => {
      vi.mocked(resetPasswordModel).mockResolvedValue({
        error: 'No se pudo actualizar la contraseña. Intenta de nuevo.',
      });

      const result = await resetPassword('NewPassword');

      expect(result.error).toContain('No se pudo actualizar');
    });
  });
});
