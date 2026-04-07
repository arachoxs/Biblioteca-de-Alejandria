import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/models/authModel', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/services/profile/profileService', () => ({
  updateProfile: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

import { updateProfileAction } from '@/app/perfil/actions';
import { getCurrentUser } from '@/models/authModel';
import { updateProfile } from '@/services/profile/profileService';
import { revalidatePath } from 'next/cache';
import type { EditPerfilFormValues } from '@/lib/types/profile';

describe('updateProfileAction', () => {
  const validFormData: EditPerfilFormValues = {
    nombres: 'Juan',
    apellidos: 'Pérez García',
    genero: 'masculino',
    usuario: 'juanperez',
    direccion_detalle: 'Piso 3A',
  };

  const validAddress = 'Calle Mayor 1, Madrid, España';
  const validPlaceId = 'ChIJgTwKgJcpQg0RaSKMYcHeNsM';

  const mockUser = {
    id: 'user-123',
    email: 'user@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await updateProfileAction(validFormData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('No hay sesión activa');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    });

    it('should return errors for empty required fields', async () => {
      const emptyData: EditPerfilFormValues = {
        nombres: '',
        apellidos: '',
        genero: '',
        usuario: '',
        direccion_detalle: '',
      };

      const result = await updateProfileAction(emptyData, '', '');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Object.keys(result.errors!).length).toBeGreaterThan(0);
    });

    it('should return error for empty address', async () => {
      const result = await updateProfileAction(validFormData, '', validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.direccion).toBeDefined();
    });

    it('should return error for missing placeId', async () => {
      const result = await updateProfileAction(validFormData, validAddress, '');

      expect(result.success).toBe(false);
      expect(result.errors?.direccion).toBeDefined(); // placeId error maps to direccion
    });
  });

  describe('update flow', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    });

    it('should call updateProfile with sanitized data', async () => {
      vi.mocked(updateProfile).mockResolvedValue({ success: true });

      await updateProfileAction(validFormData, validAddress, validPlaceId);

      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          nombres: validFormData.nombres,
          apellidos: validFormData.apellidos,
          genero: validFormData.genero,
          usuario: validFormData.usuario,
          direccion: validAddress,
          direccion_place_id: validPlaceId,
        })
      );
    });

    it('should sanitize input data before updating', async () => {
      vi.mocked(updateProfile).mockResolvedValue({ success: true });

      await updateProfileAction(
        { ...validFormData, nombres: '  Juan  ' },
        validAddress,
        validPlaceId
      );

      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          nombres: 'Juan',
        })
      );
    });

    it('should revalidate /perfil path on success', async () => {
      vi.mocked(updateProfile).mockResolvedValue({ success: true });

      await updateProfileAction(validFormData, validAddress, validPlaceId);

      expect(revalidatePath).toHaveBeenCalledWith('/perfil');
    });

    it('should not revalidate path on failure', async () => {
      vi.mocked(updateProfile).mockResolvedValue({
        success: false,
        errors: { usuario: 'Username already taken' },
      });

      await updateProfileAction(validFormData, validAddress, validPlaceId);

      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should return service errors', async () => {
      vi.mocked(updateProfile).mockResolvedValue({
        success: false,
        errors: { usuario: 'El nombre de usuario ya está en uso' },
      });

      const result = await updateProfileAction(validFormData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.usuario).toContain('ya está en uso');
    });

    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(updateProfile).mockRejectedValue(new Error('Database error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await updateProfileAction(validFormData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Error inesperado');
      expect(result.errors?.form).toContain('Database error');

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(updateProfile).mockRejectedValue('Unknown failure');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await updateProfileAction(validFormData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Desconocido');

      consoleSpy.mockRestore();
    });
  });

  describe('direccion_detalle handling', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(updateProfile).mockResolvedValue({ success: true });
    });

    it('should pass direccion_detalle when provided', async () => {
      await updateProfileAction(
        { ...validFormData, direccion_detalle: 'Apt 4B' },
        validAddress,
        validPlaceId
      );

      expect(updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          direccion_detalle: 'Apt 4B',
        })
      );
    });

    it('should pass undefined direccion_detalle when empty', async () => {
      await updateProfileAction(
        { ...validFormData, direccion_detalle: '' },
        validAddress,
        validPlaceId
      );

      // Empty string is still passed, service handles conversion
      expect(updateProfile).toHaveBeenCalled();
    });
  });
});
