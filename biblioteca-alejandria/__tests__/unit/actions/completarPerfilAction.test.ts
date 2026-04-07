import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/models/authModel', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/services/profile/completeProfileService', () => ({
  completeAdminProfile: vi.fn(),
}));

import { completarPerfilAction } from '@/app/completar-perfil/actions';
import { getCurrentUser } from '@/models/authModel';
import { completeAdminProfile } from '@/services/profile/completeProfileService';

describe('completarPerfilAction', () => {
  const mockUser = {
    id: 'user-123',
    email: 'admin@example.com',
  };

  const validAddress = 'Calle Mayor 1, Madrid, España';
  const validPlaceId = 'ChIJgTwKgJcpQg0RaSKMYcHeNsM';

  const createFormData = (data: Record<string, string>): FormData => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return formData;
  };

  const validFormFields = {
    dni: '12345678A',
    nombres: 'Juan',
    apellidos: 'Pérez García',
    fecha_nacimiento: '1990-01-15',
    lugar_nacimiento: 'ChIJi7xhMnjjQgwR7KNoB5Qs7KY',
    genero: 'masculino',
    usuario: 'juanperez',
    direccion_detalle: 'Piso 3A',
    nueva_contrasena: 'NewPassword123!',
    confirmar_contrasena: 'NewPassword123!',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authentication', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const formData = createFormData(validFormFields);
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('No hay sesión activa');
    });
  });

  describe('validation', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    });

    it('should return errors for empty required fields', async () => {
      const emptyFormData = createFormData({
        dni: '',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        lugar_nacimiento: '',
        genero: '',
        usuario: '',
        nueva_contrasena: '',
        confirmar_contrasena: '',
      });

      const result = await completarPerfilAction(emptyFormData, '', '');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Object.keys(result.errors!).length).toBeGreaterThan(0);
    });

    it('should return error for invalid DNI', async () => {
      const formData = createFormData({ ...validFormFields, dni: 'AB' });
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.dni).toBeDefined();
    });

    it('should return error for invalid birth date', async () => {
      const formData = createFormData({ ...validFormFields, fecha_nacimiento: 'not-a-date' });
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.fecha_nacimiento).toBeDefined();
    });

    it('should return error for invalid genero', async () => {
      const formData = createFormData({ ...validFormFields, genero: '' });
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.genero).toBeDefined();
    });

    it('should return error for missing password', async () => {
      const formData = createFormData({ ...validFormFields, nueva_contrasena: '' });
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.nueva_contrasena).toBeDefined();
    });

    it('should return error for missing confirmation password', async () => {
      const formData = createFormData({ ...validFormFields, confirmar_contrasena: '' });
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.confirmar_contrasena).toBeDefined();
    });

    it('should return error when passwords do not match', async () => {
      const formData = createFormData({
        ...validFormFields,
        confirmar_contrasena: 'DifferentPassword123!',
      });
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.confirmar_contrasena).toContain('no coinciden');
    });

    it('should return error for weak password', async () => {
      const formData = createFormData({
        ...validFormFields,
        nueva_contrasena: 'weak',
        confirmar_contrasena: 'weak',
      });
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.nueva_contrasena).toBeDefined();
    });

    it('should return error for missing address', async () => {
      const formData = createFormData(validFormFields);
      const result = await completarPerfilAction(formData, '', validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.direccion).toBeDefined();
    });

    it('should return error for missing placeId', async () => {
      const formData = createFormData(validFormFields);
      const result = await completarPerfilAction(formData, validAddress, '');

      expect(result.success).toBe(false);
      expect(result.errors?.direccion).toBeDefined(); // placeId error maps to direccion
    });
  });

  describe('profile completion flow', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
    });

    it('should call completeAdminProfile with sanitized data', async () => {
      vi.mocked(completeAdminProfile).mockResolvedValue({ success: true });

      const formData = createFormData(validFormFields);
      await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(completeAdminProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          dni: validFormFields.dni,
          nombres: validFormFields.nombres,
          apellidos: validFormFields.apellidos,
          fecha_nacimiento: validFormFields.fecha_nacimiento,
          lugar_nacimiento: validFormFields.lugar_nacimiento,
          genero: validFormFields.genero,
          usuario: validFormFields.usuario,
          direccion: validAddress,
          direccion_place_id: validPlaceId,
          direccion_detalle: validFormFields.direccion_detalle,
          nueva_contrasena: validFormFields.nueva_contrasena,
        })
      );
    });

    it('should return success when service succeeds', async () => {
      vi.mocked(completeAdminProfile).mockResolvedValue({ success: true });

      const formData = createFormData(validFormFields);
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(true);
    });

    it('should return service errors', async () => {
      vi.mocked(completeAdminProfile).mockResolvedValue({
        success: false,
        errors: { dni: 'El DNI ya está registrado' },
      });

      const formData = createFormData(validFormFields);
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.dni).toBe('El DNI ya está registrado');
    });

    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(completeAdminProfile).mockRejectedValue(new Error('Service unavailable'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const formData = createFormData(validFormFields);
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Error inesperado');
      expect(result.errors?.form).toContain('Service unavailable');

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(completeAdminProfile).mockRejectedValue({ message: 'Unknown' });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const formData = createFormData(validFormFields);
      const result = await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Desconocido');

      consoleSpy.mockRestore();
    });
  });

  describe('null direccion_detalle handling', () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(completeAdminProfile).mockResolvedValue({ success: true });
    });

    it('should pass null direccion_detalle when not provided', async () => {
      const fields = { ...validFormFields };
      delete (fields as Record<string, string>).direccion_detalle;
      
      const formData = createFormData(fields);
      await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(completeAdminProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          direccion_detalle: null,
        })
      );
    });

    it('should pass direccion_detalle when provided', async () => {
      const formData = createFormData({ ...validFormFields, direccion_detalle: 'Apt 5' });
      await completarPerfilAction(formData, validAddress, validPlaceId);

      expect(completeAdminProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          direccion_detalle: 'Apt 5',
        })
      );
    });
  });
});
