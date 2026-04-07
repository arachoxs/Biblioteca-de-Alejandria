import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/models/authModel');
vi.mock('@/models/userModel');
vi.mock('@/models/addressModel');
vi.mock('@/lib/supabase/server');

import { getCurrentUser } from '@/models/authModel';
import {
  getUserProfileById,
  checkUsernameExists,
  updateUserProfile,
} from '@/models/userModel';
import { createAddress, deleteAddress } from '@/models/addressModel';
import { createAdminClient } from '@/lib/supabase/server';
import { fetchProfile, updateProfile } from '@/services/profile/profileService';
import {
  mockRawUserProfile,
  validProfileUpdatePayload,
} from '@/__tests__/mocks/fixtures';
import { createMockUser } from '@/__tests__/mocks/auth';

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── fetchProfile ──────────────────────────────────────────────────

  describe('fetchProfile', () => {
    it('should return full profile data when user exists', async () => {
      const mockUser = createMockUser({ id: 'user-123', email: 'test@example.com' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue(mockRawUserProfile);

      const result = await fetchProfile();

      expect(result).not.toBeNull();
      expect(result?.dni).toBe(mockRawUserProfile.dni);
      expect(result?.nombres).toBe(mockRawUserProfile.nombres);
      expect(result?.correo).toBe('test@example.com');
      expect(result?.direccion_formateada).toBe(mockRawUserProfile.direccion?.direccion_formateada);
    });

    it('should return null when no user is authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await fetchProfile();

      expect(result).toBeNull();
      expect(getUserProfileById).not.toHaveBeenCalled();
    });

    it('should return null when user has no profile in database', async () => {
      const mockUser = createMockUser({ id: 'user-no-profile' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue(null);

      const result = await fetchProfile();

      expect(result).toBeNull();
    });
  });

  // ─── updateProfile ─────────────────────────────────────────────────

  describe('updateProfile', () => {
    const mockAdminAuth = {
      admin: {
        updateUserById: vi.fn(),
      },
    };

    const mockAdminClient = {
      auth: mockAdminAuth,
    };

    beforeEach(() => {
      vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as unknown as ReturnType<typeof createAdminClient>);
      mockAdminAuth.admin.updateUserById.mockReset();
    });

    it('should update profile successfully without username change', async () => {
      const mockUser = createMockUser({
        id: 'user-update',
        user_metadata: { username: 'juancarlos' },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue({
        ...mockRawUserProfile,
        id_direccion: 10,
      });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 20 });
      vi.mocked(updateUserProfile).mockResolvedValue({ success: true });

      const payload = { ...validProfileUpdatePayload, usuario: 'juancarlos' };
      const result = await updateProfile(payload);

      expect(result.success).toBe(true);
      expect(result.message).toContain('actualizado');
      expect(checkUsernameExists).not.toHaveBeenCalled();
      expect(createAddress).toHaveBeenCalled();
      expect(updateUserProfile).toHaveBeenCalledWith('user-update', expect.objectContaining({
        id_direccion: 20,
      }));
    });

    it('should validate username uniqueness when it changes', async () => {
      const mockUser = createMockUser({
        id: 'user-username-change',
        user_metadata: { username: 'olduser' },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue(mockRawUserProfile);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 30 });
      vi.mocked(updateUserProfile).mockResolvedValue({ success: true });
      mockAdminAuth.admin.updateUserById.mockResolvedValue({ error: null });

      const payload = { ...validProfileUpdatePayload, usuario: 'newuser' };
      const result = await updateProfile(payload);

      expect(result.success).toBe(true);
      expect(checkUsernameExists).toHaveBeenCalledWith('newuser');
      expect(mockAdminAuth.admin.updateUserById).toHaveBeenCalledWith(
        'user-username-change',
        expect.objectContaining({ user_metadata: { username: 'newuser' } })
      );
    });

    it('should fail when username already exists', async () => {
      const mockUser = createMockUser({
        id: 'user-dup-username',
        user_metadata: { username: 'olduser' },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue(mockRawUserProfile);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: true });

      const payload = { ...validProfileUpdatePayload, usuario: 'existinguser' };
      const result = await updateProfile(payload);

      expect(result.success).toBe(false);
      expect(result.errors?.usuario).toContain('ya está en uso');
      expect(createAddress).not.toHaveBeenCalled();
    });

    it('should fail when username check errors', async () => {
      const mockUser = createMockUser({
        id: 'user-check-error',
        user_metadata: { username: 'olduser' },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue(mockRawUserProfile);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false, error: 'RPC error' });

      const payload = { ...validProfileUpdatePayload, usuario: 'newuser' };
      const result = await updateProfile(payload);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('RPC error');
    });

    it('should fail when address creation fails', async () => {
      const mockUser = createMockUser({
        id: 'user-addr-fail',
        user_metadata: { username: 'juancarlos' },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue(mockRawUserProfile);
      vi.mocked(createAddress).mockResolvedValue({ success: false, error: 'Address error' });

      const payload = { ...validProfileUpdatePayload, usuario: 'juancarlos' };
      const result = await updateProfile(payload);

      expect(result.success).toBe(false);
      expect(result.errors?.direccion).toContain('Address error');
    });

    it('should rollback address when profile update fails', async () => {
      const mockUser = createMockUser({
        id: 'user-profile-fail',
        user_metadata: { username: 'juancarlos' },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue({
        ...mockRawUserProfile,
        id_direccion: 10,
      });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 50 });
      vi.mocked(updateUserProfile).mockResolvedValue({ success: false, error: 'Profile update error' });

      const payload = { ...validProfileUpdatePayload, usuario: 'juancarlos' };
      const result = await updateProfile(payload);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Profile update error');
      expect(deleteAddress).toHaveBeenCalledWith(50);
    });

    it('should rollback profile and address when username update fails', async () => {
      const mockUser = createMockUser({
        id: 'user-meta-fail',
        user_metadata: { username: 'olduser' },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue({
        ...mockRawUserProfile,
        id_direccion: 10,
      });
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 60 });
      vi.mocked(updateUserProfile).mockResolvedValue({ success: true });
      mockAdminAuth.admin.updateUserById.mockResolvedValue({
        error: { message: 'Auth metadata update failed' },
      });

      const payload = { ...validProfileUpdatePayload, usuario: 'newuser' };
      const result = await updateProfile(payload);

      expect(result.success).toBe(false);
      expect(result.errors?.usuario).toContain('Cambios revertidos');
      expect(updateUserProfile).toHaveBeenCalledTimes(2);
      expect(deleteAddress).toHaveBeenCalledWith(60);
    });

    it('should return error when no session is active', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await updateProfile(validProfileUpdatePayload);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('No hay sesión activa');
    });

    it('should return error when profile not found', async () => {
      const mockUser = createMockUser({ id: 'user-no-profile' });
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(getUserProfileById).mockResolvedValue(null);

      const result = await updateProfile(validProfileUpdatePayload);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Perfil no encontrado');
    });

    it('should handle unexpected exceptions', async () => {
      vi.mocked(getCurrentUser).mockRejectedValue(new Error('Unexpected error'));

      const result = await updateProfile(validProfileUpdatePayload);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Unexpected error');
    });
  });
});
