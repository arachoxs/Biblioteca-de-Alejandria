import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/models/authModel');
vi.mock('@/models/userModel');
vi.mock('@/models/addressModel');
vi.mock('@/lib/supabase/server');

import { getCurrentUser } from '@/models/authModel';
import {
  checkDniExists,
  checkUsernameExists,
  createUserProfile,
  deleteUserProfile,
} from '@/models/userModel';
import { createAddress, deleteAddress } from '@/models/addressModel';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { completeAdminProfile } from '@/services/profile/completeProfileService';
import { validFullProfilePayload } from '@/__tests__/mocks/fixtures';
import { createMockAdminUser } from '@/__tests__/mocks/auth';
import { Genero } from '@/lib/types/auth';

describe('completeProfileService', () => {
  const mockAdminAuth = {
    admin: {
      getUserById: vi.fn(),
      updateUserById: vi.fn(),
    },
  };

  const mockAdminClient = {
    auth: mockAdminAuth,
  };

  const mockSupabaseAuth = {
    updateUser: vi.fn(),
  };

  const mockSupabaseClient = {
    auth: mockSupabaseAuth,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as unknown as ReturnType<typeof createAdminClient>);
    vi.mocked(createClient).mockResolvedValue(mockSupabaseClient as unknown as Awaited<ReturnType<typeof createClient>>);
    mockAdminAuth.admin.getUserById.mockReset();
    mockAdminAuth.admin.updateUserById.mockReset();
    mockSupabaseAuth.updateUser.mockReset();
  });

  const validInput = {
    ...validFullProfilePayload,
    genero: Genero.Masculino,
    nueva_contrasena: 'NewSecurePass123!',
  };

  // ─── completeAdminProfile ──────────────────────────────────────────

  describe('completeAdminProfile', () => {
    it('should complete admin profile successfully', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-complete' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 100 });
      vi.mocked(createUserProfile).mockResolvedValue({ success: true });
      mockAdminAuth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            app_metadata: { role: 'ADMINISTRADOR' },
            user_metadata: {},
          },
        },
        error: null,
      });
      mockAdminAuth.admin.updateUserById.mockResolvedValue({ error: null });
      mockSupabaseAuth.updateUser.mockResolvedValue({ error: null });

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(true);
      expect(result.message).toContain('exitosamente');
      expect(checkDniExists).toHaveBeenCalledWith(validInput.dni);
      expect(checkUsernameExists).toHaveBeenCalledWith(validInput.usuario);
      expect(createAddress).toHaveBeenCalled();
      expect(createUserProfile).toHaveBeenCalled();
      expect(mockAdminAuth.admin.updateUserById).toHaveBeenCalledWith(
        'admin-complete',
        expect.objectContaining({
          app_metadata: expect.objectContaining({ profile_complete: true }),
          user_metadata: expect.objectContaining({ username: validInput.usuario }),
        })
      );
      expect(mockSupabaseAuth.updateUser).toHaveBeenCalledWith({
        password: validInput.nueva_contrasena,
      });
    });

    it('should fail when DNI already exists', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-dni-exists' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(true);

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(false);
      expect(result.errors?.dni).toContain('ya ha sido registrado');
      expect(createAddress).not.toHaveBeenCalled();
    });

    it('should fail when username already exists', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-username-exists' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: true });

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(false);
      expect(result.errors?.usuario).toContain('ya ha sido registrado');
      expect(createAddress).not.toHaveBeenCalled();
    });

    it('should fail when username check errors', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-check-error' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false, error: 'RPC timeout' });

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('RPC timeout');
    });

    it('should fail when address creation fails', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-addr-fail' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(createAddress).mockResolvedValue({ success: false, error: 'Address insert error' });

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(false);
      expect(result.errors?.direccion).toContain('Address insert error');
    });

    it('should rollback address when profile creation fails', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-profile-fail' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 200 });
      vi.mocked(createUserProfile).mockResolvedValue({ success: false, error: 'Profile insert error' });

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Profile insert error');
      expect(deleteAddress).toHaveBeenCalledWith(200);
    });

    it('should rollback profile and address when metadata update fails', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-meta-fail' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 300 });
      vi.mocked(createUserProfile).mockResolvedValue({ success: true });
      mockAdminAuth.admin.getUserById.mockResolvedValue({
        data: { user: { app_metadata: {}, user_metadata: {} } },
        error: null,
      });
      mockAdminAuth.admin.updateUserById.mockResolvedValue({
        error: { message: 'Metadata update failed' },
      });

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('No se pudo finalizar');
      expect(deleteUserProfile).toHaveBeenCalledWith('admin-meta-fail');
      expect(deleteAddress).toHaveBeenCalledWith(300);
    });

    it('should rollback all when password update fails', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-pwd-fail' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 400 });
      vi.mocked(createUserProfile).mockResolvedValue({ success: true });
      mockAdminAuth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            app_metadata: { role: 'ADMINISTRADOR' },
            user_metadata: {},
          },
        },
        error: null,
      });
      mockAdminAuth.admin.updateUserById.mockResolvedValue({ error: null });
      mockSupabaseAuth.updateUser.mockResolvedValue({
        error: { message: 'Password too weak' },
      });

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('No se pudo actualizar la contraseña');
      expect(mockAdminAuth.admin.updateUserById).toHaveBeenCalledTimes(2);
      expect(deleteUserProfile).toHaveBeenCalledWith('admin-pwd-fail');
      expect(deleteAddress).toHaveBeenCalledWith(400);
    });

    it('should return error when no session is active', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('No hay sesión activa');
    });

    it('should handle unexpected exceptions with rollback', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-exception' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 500 });
      vi.mocked(createUserProfile).mockRejectedValue(new Error('Unexpected DB error'));

      const result = await completeAdminProfile(validInput);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Unexpected DB error');
      expect(deleteAddress).toHaveBeenCalledWith(500);
    });

    it('should preserve existing app_metadata when updating', async () => {
      const mockUser = createMockAdminUser({ id: 'admin-preserve-meta' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 600 });
      vi.mocked(createUserProfile).mockResolvedValue({ success: true });
      mockAdminAuth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            app_metadata: { role: 'ADMINISTRADOR', custom_claim: 'value' },
            user_metadata: { existing: 'data' },
          },
        },
        error: null,
      });
      mockAdminAuth.admin.updateUserById.mockResolvedValue({ error: null });
      mockSupabaseAuth.updateUser.mockResolvedValue({ error: null });

      await completeAdminProfile(validInput);

      expect(mockAdminAuth.admin.updateUserById).toHaveBeenCalledWith(
        'admin-preserve-meta',
        expect.objectContaining({
          app_metadata: expect.objectContaining({
            role: 'ADMINISTRADOR',
            custom_claim: 'value',
            profile_complete: true,
          }),
        })
      );
    });
  });
});
