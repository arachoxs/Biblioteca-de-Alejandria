import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/models/authModel');
vi.mock('@/services/admin/auditService');

import {
  updatePasswordWithVerification,
  deactivateUsers,
  activateUsers,
  getCurrentUser,
} from '@/models/authModel';
import { logAdminAction } from '@/services/admin/auditService';
import { changePassword, deshabilitarUsuario, habilitarUsuario } from '@/services/auth/authService';
import { createMockRootUser, createMockAdminUser } from '@/__tests__/mocks/auth';
import { Rol } from '@/lib/types/auth';
import { AccionAdministrador } from '@/lib/types/audit';

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── changePassword ────────────────────────────────────────────────

  describe('changePassword', () => {
    it('should delegate to model updatePasswordWithVerification', async () => {
      vi.mocked(updatePasswordWithVerification).mockResolvedValue({
        success: true,
        message: 'Contraseña actualizada exitosamente.',
      });

      const result = await changePassword('currentPass', 'newPass');

      expect(updatePasswordWithVerification).toHaveBeenCalledWith('currentPass', 'newPass');
      expect(result.success).toBe(true);
      expect(result.message).toContain('actualizada');
    });

    it('should propagate error from model', async () => {
      vi.mocked(updatePasswordWithVerification).mockResolvedValue({
        error: 'La contraseña actual es incorrecta.',
      });

      const result = await changePassword('wrongPass', 'newPass');

      expect(result.error).toContain('incorrecta');
    });
  });

  // ─── deshabilitarUsuario ───────────────────────────────────────────

  describe('deshabilitarUsuario', () => {
    it('should deactivate users when actor is ROOT', async () => {
      const rootUser = createMockRootUser();
      vi.mocked(getCurrentUser).mockResolvedValue(rootUser);
      vi.mocked(deactivateUsers).mockResolvedValue({
        success: true,
        message: '1 desactivado(s)',
      });

      const result = await deshabilitarUsuario(['user-1', 'user-2']);

      expect(result.success).toBe(true);
      expect(deactivateUsers).toHaveBeenCalledWith(['user-1', 'user-2']);
      expect(logAdminAction).toHaveBeenCalled();
    });

    it('should log audit action for each successfully deactivated user', async () => {
      const rootUser = createMockRootUser();
      vi.mocked(getCurrentUser).mockResolvedValue(rootUser);
      vi.mocked(deactivateUsers).mockResolvedValue({
        success: true,
        message: '2 desactivado(s)',
      });

      await deshabilitarUsuario(['user-1', 'user-2']);

      expect(logAdminAction).toHaveBeenCalledTimes(2);
      expect(logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: rootUser.id,
          action: AccionAdministrador.MODIFICAR,
          description: 'Se deshabilitó al administrador.',
        })
      );
    });

    it('should reject when actor is not ROOT', async () => {
      const adminUser = createMockAdminUser();
      vi.mocked(getCurrentUser).mockResolvedValue(adminUser);

      const result = await deshabilitarUsuario(['user-1']);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Solo usuarios ROOT');
      expect(result.errorIds).toEqual(['user-1']);
      expect(deactivateUsers).not.toHaveBeenCalled();
    });

    it('should reject when no user is authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await deshabilitarUsuario(['user-1']);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No tienes permisos');
    });

    it('should handle partial failures correctly', async () => {
      const rootUser = createMockRootUser();
      vi.mocked(getCurrentUser).mockResolvedValue(rootUser);
      vi.mocked(deactivateUsers).mockResolvedValue({
        success: true,
        message: '1 desactivado(s), 1 fallido(s)',
        errorIds: ['user-2'],
      });

      const result = await deshabilitarUsuario(['user-1', 'user-2']);

      expect(result.success).toBe(true);
      expect(logAdminAction).toHaveBeenCalledTimes(1);
    });

    it('should not log audit when deactivation fails', async () => {
      const rootUser = createMockRootUser();
      vi.mocked(getCurrentUser).mockResolvedValue(rootUser);
      vi.mocked(deactivateUsers).mockResolvedValue({
        success: false,
        message: 'No se pudo desactivar ningún usuario',
        errorIds: ['user-1'],
      });

      await deshabilitarUsuario(['user-1']);

      expect(logAdminAction).not.toHaveBeenCalled();
    });
  });

  // ─── habilitarUsuario ──────────────────────────────────────────────

  describe('habilitarUsuario', () => {
    it('should activate users when actor is ROOT', async () => {
      const rootUser = createMockRootUser();
      vi.mocked(getCurrentUser).mockResolvedValue(rootUser);
      vi.mocked(activateUsers).mockResolvedValue({
        success: true,
        message: '1 activado(s)',
      });

      const result = await habilitarUsuario(['user-1']);

      expect(result.success).toBe(true);
      expect(activateUsers).toHaveBeenCalledWith(['user-1']);
      expect(logAdminAction).toHaveBeenCalled();
    });

    it('should log audit action for each successfully activated user', async () => {
      const rootUser = createMockRootUser();
      vi.mocked(getCurrentUser).mockResolvedValue(rootUser);
      vi.mocked(activateUsers).mockResolvedValue({
        success: true,
        message: '2 activado(s)',
      });

      await habilitarUsuario(['user-1', 'user-2']);

      expect(logAdminAction).toHaveBeenCalledTimes(2);
      expect(logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: rootUser.id,
          action: AccionAdministrador.MODIFICAR,
          description: 'Se habilitó al administrador.',
        })
      );
    });

    it('should reject when actor is not ROOT', async () => {
      const adminUser = createMockAdminUser();
      vi.mocked(getCurrentUser).mockResolvedValue(adminUser);

      const result = await habilitarUsuario(['user-1']);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Solo usuarios ROOT');
      expect(result.errorIds).toEqual(['user-1']);
      expect(activateUsers).not.toHaveBeenCalled();
    });

    it('should reject when no user is authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await habilitarUsuario(['user-1']);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No tienes permisos');
    });

    it('should not log audit when activation fails', async () => {
      const rootUser = createMockRootUser();
      vi.mocked(getCurrentUser).mockResolvedValue(rootUser);
      vi.mocked(activateUsers).mockResolvedValue({
        success: false,
        message: 'No se pudo activar ningún usuario',
        errorIds: ['user-1'],
      });

      await habilitarUsuario(['user-1']);

      expect(logAdminAction).not.toHaveBeenCalled();
    });
  });
});
