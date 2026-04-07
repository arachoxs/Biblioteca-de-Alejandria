import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/models/authModel');
vi.mock('@/models/userModel');
vi.mock('@/models/addressModel');
vi.mock('@/lib/services/email');

import {
  signUp,
  adminSignUp,
  deleteAuthUser,
  isCurrentUserRoot,
  setUserRole,
} from '@/models/authModel';
import { checkDniExists, checkUsernameExists, createUserProfile } from '@/models/userModel';
import { createAddress, deleteAddress } from '@/models/addressModel';
import { sendEmail } from '@/lib/services/email';
import { notifyNewAdmin, registerAuthUser, register } from '@/services/auth/registrationService';
import { validCredentials, validPersonalData } from '@/__tests__/mocks/fixtures';
import { createMockUser } from '@/__tests__/mocks/auth';
import { Rol } from '@/lib/types/auth';

describe('registrationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── notifyNewAdmin ────────────────────────────────────────────────

  describe('notifyNewAdmin', () => {
    it('should return success when email is sent successfully', async () => {
      vi.mocked(sendEmail).mockResolvedValue({ success: true, message: 'Email sent' });

      const result = await notifyNewAdmin('admin@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@example.com',
          subject: expect.stringContaining('Credenciales de Administrador'),
        })
      );
    });

    it('should return failure when email sending fails', async () => {
      vi.mocked(sendEmail).mockResolvedValue({ success: false, message: 'SMTP error' });

      const result = await notifyNewAdmin('admin@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('SMTP error');
    });

    it('should handle exception during email sending', async () => {
      vi.mocked(sendEmail).mockRejectedValue(new Error('Network error'));

      const result = await notifyNewAdmin('admin@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error al enviar el correo de credenciales.');
    });
  });

  // ─── registerAuthUser ──────────────────────────────────────────────

  describe('registerAuthUser', () => {
    it('should register a client user successfully', async () => {
      const mockUser = createMockUser({ id: 'client-123' });
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(signUp).mockResolvedValue({
        success: true,
        data: { user: mockUser, session: null },
      });

      const result = await registerAuthUser(validCredentials, Rol.CLIENTE, 'testuser');

      expect(result.success).toBe(true);
      expect(signUp).toHaveBeenCalledWith(
        validCredentials.correo,
        validCredentials.contrasena,
        'testuser'
      );
      expect(isCurrentUserRoot).not.toHaveBeenCalled();
    });

    it('should require ROOT permission for admin registration', async () => {
      vi.mocked(isCurrentUserRoot).mockResolvedValue(false);

      const result = await registerAuthUser(validCredentials, Rol.ADMINISTRADOR);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('No tienes permisos');
      expect(adminSignUp).not.toHaveBeenCalled();
    });

    it('should register admin when user is ROOT', async () => {
      const mockUser = createMockUser({ id: 'admin-123' });
      vi.mocked(isCurrentUserRoot).mockResolvedValue(true);
      vi.mocked(adminSignUp).mockResolvedValue({
        success: true,
        data: { user: mockUser, session: null },
      });
      vi.mocked(setUserRole).mockResolvedValue({ success: true });
      vi.mocked(sendEmail).mockResolvedValue({ success: true, message: 'Sent' });

      const result = await registerAuthUser(validCredentials, Rol.ADMINISTRADOR);

      expect(result.success).toBe(true);
      expect(adminSignUp).toHaveBeenCalled();
      expect(setUserRole).toHaveBeenCalledWith('admin-123', Rol.ADMINISTRADOR);
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should fail when username already exists', async () => {
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: true });

      const result = await registerAuthUser(validCredentials, Rol.CLIENTE, 'existinguser');

      expect(result.success).toBe(false);
      expect(result.errors?.usuario).toContain('ya está en uso');
    });

    it('should return error when username check fails', async () => {
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false, error: 'DB error' });

      const result = await registerAuthUser(validCredentials, Rol.CLIENTE, 'newuser');

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('DB error');
    });

    it('should propagate auth errors from signup', async () => {
      vi.mocked(signUp).mockResolvedValue({
        success: false,
        errors: { correo: 'Este correo electrónico ya está registrado.' },
      });

      const result = await registerAuthUser(validCredentials, Rol.CLIENTE);

      expect(result.success).toBe(false);
      expect(result.errors?.correo).toBeDefined();
    });

    it('should rollback auth user when role assignment fails', async () => {
      const mockUser = createMockUser({ id: 'admin-456' });
      vi.mocked(isCurrentUserRoot).mockResolvedValue(true);
      vi.mocked(adminSignUp).mockResolvedValue({
        success: true,
        data: { user: mockUser, session: null },
      });
      vi.mocked(setUserRole).mockResolvedValue({ success: false, error: 'Role error' });

      const result = await registerAuthUser(validCredentials, Rol.ADMINISTRADOR);

      expect(result.success).toBe(false);
      expect(deleteAuthUser).toHaveBeenCalledWith('admin-456');
    });

    it('should rollback auth user when email notification fails for admin', async () => {
      const mockUser = createMockUser({ id: 'admin-789' });
      vi.mocked(isCurrentUserRoot).mockResolvedValue(true);
      vi.mocked(adminSignUp).mockResolvedValue({
        success: true,
        data: { user: mockUser, session: null },
      });
      vi.mocked(setUserRole).mockResolvedValue({ success: true });
      vi.mocked(sendEmail).mockResolvedValue({ success: false, message: 'Email failed' });

      const result = await registerAuthUser(validCredentials, Rol.ADMINISTRADOR);

      expect(result.success).toBe(false);
      expect(deleteAuthUser).toHaveBeenCalledWith('admin-789');
      expect(result.errors?.form).toContain('Error al enviar correo');
    });
  });

  // ─── register ──────────────────────────────────────────────────────

  describe('register', () => {
    it('should complete full registration successfully', async () => {
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(signUp).mockResolvedValue({
        success: true,
        data: { user: createMockUser({ id: 'user-123' }), session: null },
      });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 1 });
      vi.mocked(createUserProfile).mockResolvedValue({ success: true });

      const result = await register(validCredentials, validPersonalData, Rol.CLIENTE);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Registro exitoso');
      expect(checkDniExists).toHaveBeenCalledWith(validPersonalData.dni);
      expect(createAddress).toHaveBeenCalled();
      expect(createUserProfile).toHaveBeenCalled();
    });

    it('should fail when DNI already exists', async () => {
      vi.mocked(checkDniExists).mockResolvedValue(true);

      const result = await register(validCredentials, validPersonalData, Rol.CLIENTE);

      expect(result.success).toBe(false);
      expect(result.errors?.dni).toContain('ya se encuentra registrado');
      expect(signUp).not.toHaveBeenCalled();
    });

    it('should fail when auth registration fails', async () => {
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(signUp).mockResolvedValue({
        success: false,
        errors: { form: 'Auth service unavailable' },
        message: 'Auth service unavailable',
      });

      const result = await register(validCredentials, validPersonalData, Rol.CLIENTE);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toBeDefined();
      expect(createAddress).not.toHaveBeenCalled();
    });

    it('should rollback auth user when address creation fails', async () => {
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(signUp).mockResolvedValue({
        success: true,
        data: { user: createMockUser({ id: 'user-addr-fail' }), session: null },
      });
      vi.mocked(createAddress).mockResolvedValue({ success: false, error: 'Address DB error' });

      const result = await register(validCredentials, validPersonalData, Rol.CLIENTE);

      expect(result.success).toBe(false);
      expect(result.errors?.direccion).toContain('Address DB error');
      expect(deleteAuthUser).toHaveBeenCalledWith('user-addr-fail');
    });

    it('should rollback auth user and address when profile creation fails', async () => {
      vi.mocked(checkDniExists).mockResolvedValue(false);
      vi.mocked(checkUsernameExists).mockResolvedValue({ exists: false });
      vi.mocked(signUp).mockResolvedValue({
        success: true,
        data: { user: createMockUser({ id: 'user-profile-fail' }), session: null },
      });
      vi.mocked(createAddress).mockResolvedValue({ success: true, id: 42 });
      vi.mocked(createUserProfile).mockResolvedValue({ success: false, error: 'Profile DB error' });

      const result = await register(validCredentials, validPersonalData, Rol.CLIENTE);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Profile DB error');
      expect(deleteAuthUser).toHaveBeenCalledWith('user-profile-fail');
      expect(deleteAddress).toHaveBeenCalledWith(42);
    });

    it('should handle unexpected exceptions gracefully', async () => {
      vi.mocked(checkDniExists).mockRejectedValue(new Error('Unexpected DB failure'));

      const result = await register(validCredentials, validPersonalData, Rol.CLIENTE);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Unexpected DB failure');
    });
  });
});
