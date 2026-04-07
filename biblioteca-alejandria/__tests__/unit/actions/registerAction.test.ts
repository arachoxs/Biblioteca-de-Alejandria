import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing action
vi.mock('@/services/auth/registrationService', () => ({
  register: vi.fn(),
}));

vi.mock('@/models/authModel', () => ({
  signIn: vi.fn(),
}));

import { registerUser } from '@/app/(auth)/register/actions';
import { register } from '@/services/auth/registrationService';
import { signIn } from '@/models/authModel';
import type { CredentialData, PersonalData, Rol } from '@/lib/types/auth';

describe('registerUser', () => {
  const validCredentials: CredentialData = {
    correo: 'test@example.com',
    contrasena: 'Password123!',
    confirmar_contrasena: 'Password123!',
  };

  const validPersonalData: PersonalData = {
    dni: '12345678A',
    nombres: 'Juan',
    apellidos: 'Pérez García',
    fecha_nacimiento: '1990-01-15',
    lugar_nacimiento: 'ChIJi7xhMnjjQgwR7KNoB5Qs7KY', // Google Place ID
    genero: 'masculino',
    usuario: 'juanperez',
    direccion: 'Calle Mayor 1, Madrid, España',
    direccion_place_id: 'ChIJgTwKgJcpQg0RaSKMYcHeNsM',
    direccion_detalle: 'Piso 3A',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should return errors for missing required fields', async () => {
      const emptyCredentials: CredentialData = {
        correo: '',
        contrasena: '',
        confirmar_contrasena: '',
      };

      const emptyPersonal: PersonalData = {
        dni: '',
        nombres: '',
        apellidos: '',
        fecha_nacimiento: '',
        lugar_nacimiento: '',
        genero: '',
        usuario: '',
        direccion: '',
        direccion_place_id: '',
      };

      const result = await registerUser(emptyCredentials, emptyPersonal);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Object.keys(result.errors!).length).toBeGreaterThan(0);
    });

    it('should return error for invalid email', async () => {
      const result = await registerUser(
        { ...validCredentials, correo: 'invalid-email' },
        validPersonalData
      );

      expect(result.success).toBe(false);
      expect(result.errors?.correo).toBeDefined();
    });

    it('should return error for missing email', async () => {
      const result = await registerUser(
        { ...validCredentials, correo: '' },
        validPersonalData
      );

      expect(result.success).toBe(false);
      expect(result.errors?.correo).toBeDefined();
    });

    it('should return error when passwords do not match', async () => {
      const result = await registerUser(
        { ...validCredentials, confirmar_contrasena: 'DifferentPass123!' },
        validPersonalData
      );

      expect(result.success).toBe(false);
      expect(result.errors?.confirmar_contrasena).toBeDefined();
    });

    it('should return error for weak password', async () => {
      const result = await registerUser(
        { ...validCredentials, contrasena: '123', confirmar_contrasena: '123' },
        validPersonalData
      );

      expect(result.success).toBe(false);
      expect(result.errors?.contrasena).toBeDefined();
    });

    it('should return error for invalid DNI format', async () => {
      const result = await registerUser(
        validCredentials,
        { ...validPersonalData, dni: 'AB' }
      );

      expect(result.success).toBe(false);
      expect(result.errors?.dni).toBeDefined();
    });

    it('should return error for invalid birth date', async () => {
      const result = await registerUser(
        validCredentials,
        { ...validPersonalData, fecha_nacimiento: 'not-a-date' }
      );

      expect(result.success).toBe(false);
      expect(result.errors?.fecha_nacimiento).toBeDefined();
    });

    it('should sanitize input data', async () => {
      vi.mocked(register).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue({ user: { id: '1' }, session: {} } as never);

      await registerUser(
        { ...validCredentials, correo: '  test@example.com  ' },
        { ...validPersonalData, nombres: '  Juan  ' }
      );

      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({ correo: 'test@example.com' }),
        expect.objectContaining({ nombres: 'Juan' }),
        'CLIENTE' // Rol.CLIENTE enum value
      );
    });
  });

  describe('registration flow', () => {
    it('should call register service with sanitized data', async () => {
      vi.mocked(register).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue({ user: { id: '1' }, session: {} } as never);

      await registerUser(validCredentials, validPersonalData);

      expect(register).toHaveBeenCalledWith(
        expect.objectContaining({
          correo: validCredentials.correo,
          contrasena: validCredentials.contrasena,
        }),
        expect.objectContaining({
          dni: validPersonalData.dni,
          nombres: validPersonalData.nombres,
          apellidos: validPersonalData.apellidos,
          fecha_nacimiento: validPersonalData.fecha_nacimiento,
          genero: validPersonalData.genero,
          lugar_nacimiento: validPersonalData.lugar_nacimiento,
          usuario: validPersonalData.usuario,
        }),
        'CLIENTE' // Rol.CLIENTE enum value
      );
    });

    it('should auto-login on successful registration', async () => {
      vi.mocked(register).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue({ user: { id: '1' }, session: {} } as never);

      const result = await registerUser(validCredentials, validPersonalData);

      expect(result.success).toBe(true);
      expect(signIn).toHaveBeenCalledWith(
        validCredentials.correo,
        validCredentials.contrasena
      );
    });

    it('should return success even if auto-login fails', async () => {
      vi.mocked(register).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue(null);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await registerUser(validCredentials, validPersonalData);

      expect(result.success).toBe(true);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return registration errors from service', async () => {
      vi.mocked(register).mockResolvedValue({
        success: false,
        errors: { correo: 'El correo ya está registrado' },
      });

      const result = await registerUser(validCredentials, validPersonalData);

      expect(result.success).toBe(false);
      expect(result.errors?.correo).toBe('El correo ya está registrado');
      expect(signIn).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      vi.mocked(register).mockRejectedValue(new Error('Database connection failed'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await registerUser(validCredentials, validPersonalData);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Error inesperado');
      expect(result.errors?.form).toContain('Database connection failed');

      consoleSpy.mockRestore();
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(register).mockRejectedValue('String error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await registerUser(validCredentials, validPersonalData);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Desconocido');

      consoleSpy.mockRestore();
    });
  });
});
