import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/services/admin/adminService', () => ({
  createAdminAccount: vi.fn(),
  fetchAdminUsers: vi.fn(),
  searchAdmins: vi.fn(),
}));

vi.mock('@/services/auth/authService', () => ({
  deshabilitarUsuario: vi.fn(),
  habilitarUsuario: vi.fn(),
}));

import {
  createAdmin,
  getAdmins,
  searchAdminsByTerm,
  deshabilitarAdministradores,
  habilitarAdministradores,
} from '@/app/(panel)/panel-root/administradores/action';
import {
  createAdminAccount,
  fetchAdminUsers,
  searchAdmins,
} from '@/services/admin/adminService';
import {
  deshabilitarUsuario,
  habilitarUsuario,
} from '@/services/auth/authService';

describe('Admin Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAdmin', () => {
    it('should return error for empty email', async () => {
      const result = await createAdmin('');

      expect(result.success).toBe(false);
      expect(result.errors?.correo).toContain('obligatorio');
    });

    it('should return error for whitespace-only email', async () => {
      const result = await createAdmin('   ');

      expect(result.success).toBe(false);
      expect(result.errors?.correo).toContain('obligatorio');
    });

    it('should return error for invalid email format', async () => {
      const result = await createAdmin('invalid-email');

      expect(result.success).toBe(false);
      expect(result.errors?.correo).toBeDefined();
    });

    it('should sanitize email before creating', async () => {
      vi.mocked(createAdminAccount).mockResolvedValue({ success: true });

      await createAdmin('  admin@example.com  ');

      expect(createAdminAccount).toHaveBeenCalledWith('admin@example.com');
    });

    it('should call service with valid email', async () => {
      vi.mocked(createAdminAccount).mockResolvedValue({ success: true });

      const result = await createAdmin('newadmin@example.com');

      expect(createAdminAccount).toHaveBeenCalledWith('newadmin@example.com');
      expect(result.success).toBe(true);
    });

    it('should return service errors', async () => {
      vi.mocked(createAdminAccount).mockResolvedValue({
        success: false,
        errors: { correo: 'El correo ya está registrado' },
      });

      const result = await createAdmin('existing@example.com');

      expect(result.success).toBe(false);
      expect(result.errors?.correo).toContain('ya está registrado');
    });
  });

  describe('getAdmins', () => {
    it('should call fetchAdminUsers with default pagination', async () => {
      vi.mocked(fetchAdminUsers).mockResolvedValue({
        success: true,
        data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
      });

      await getAdmins();

      expect(fetchAdminUsers).toHaveBeenCalledWith(1, 10);
    });

    it('should call fetchAdminUsers with custom pagination', async () => {
      vi.mocked(fetchAdminUsers).mockResolvedValue({
        success: true,
        data: { data: [], total: 0, page: 2, pageSize: 25, totalPages: 0 },
      });

      await getAdmins(2, 25);

      expect(fetchAdminUsers).toHaveBeenCalledWith(2, 25);
    });

    it('should return paginated data from service', async () => {
      const mockData = {
        success: true,
        data: {
          data: [{ id: '1', email: 'admin@example.com' }],
          total: 1,
          page: 1,
          pageSize: 10,
          totalPages: 1,
        },
      };
      vi.mocked(fetchAdminUsers).mockResolvedValue(mockData as never);

      const result = await getAdmins();

      expect(result).toEqual(mockData);
    });
  });

  describe('searchAdminsByTerm', () => {
    it('should sanitize search term before searching', async () => {
      vi.mocked(searchAdmins).mockResolvedValue({
        success: true,
        data: [],
      });

      await searchAdminsByTerm('  admin  ');

      expect(searchAdmins).toHaveBeenCalledWith('admin');
    });

    it('should call searchAdmins with term', async () => {
      vi.mocked(searchAdmins).mockResolvedValue({
        success: true,
        data: [],
      });

      await searchAdminsByTerm('john');

      expect(searchAdmins).toHaveBeenCalledWith('john');
    });

    it('should return search results', async () => {
      const mockResults = {
        success: true,
        data: [
          { id: '1', email: 'john@example.com', nombres: 'John', apellidos: 'Doe' },
        ],
      };
      vi.mocked(searchAdmins).mockResolvedValue(mockResults as never);

      const result = await searchAdminsByTerm('john');

      expect(result).toEqual(mockResults);
    });

    it('should handle empty search term', async () => {
      vi.mocked(searchAdmins).mockResolvedValue({
        success: true,
        data: [],
      });

      await searchAdminsByTerm('');

      expect(searchAdmins).toHaveBeenCalledWith('');
    });
  });

  describe('deshabilitarAdministradores', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('should return error for empty array', async () => {
      const result = await deshabilitarAdministradores([]);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No se proporcionaron IDs');
    });

    it('should handle single string ID', async () => {
      vi.mocked(deshabilitarUsuario).mockResolvedValue({
        success: true,
        message: 'Usuario deshabilitado',
      });

      await deshabilitarAdministradores(validUUID);

      expect(deshabilitarUsuario).toHaveBeenCalledWith([validUUID]);
    });

    it('should handle array of IDs', async () => {
      const ids = [validUUID, '550e8400-e29b-41d4-a716-446655440001'];
      vi.mocked(deshabilitarUsuario).mockResolvedValue({
        success: true,
        message: 'Usuarios deshabilitados',
      });

      await deshabilitarAdministradores(ids);

      expect(deshabilitarUsuario).toHaveBeenCalledWith(ids);
    });

    it('should return error for invalid UUID format', async () => {
      const result = await deshabilitarAdministradores('not-a-uuid');

      expect(result.success).toBe(false);
      expect(result.message).toContain('IDs de usuario no son válidos');
      expect(result.errorIds).toContain('not-a-uuid');
    });

    it('should return error when some IDs are invalid', async () => {
      const result = await deshabilitarAdministradores([validUUID, 'invalid-id']);

      expect(result.success).toBe(false);
      expect(result.errorIds).toContain('invalid-id');
      expect(result.errorIds).not.toContain(validUUID);
    });

    it('should call service with valid IDs', async () => {
      vi.mocked(deshabilitarUsuario).mockResolvedValue({
        success: true,
        message: 'Usuarios deshabilitados',
      });

      const result = await deshabilitarAdministradores(validUUID);

      expect(deshabilitarUsuario).toHaveBeenCalledWith([validUUID]);
      expect(result.success).toBe(true);
    });

    it('should propagate service errors', async () => {
      vi.mocked(deshabilitarUsuario).mockResolvedValue({
        success: false,
        message: 'Permission denied',
        errorIds: [validUUID],
      });

      const result = await deshabilitarAdministradores(validUUID);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Permission denied');
    });
  });

  describe('habilitarAdministradores', () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';

    it('should return error for empty array', async () => {
      const result = await habilitarAdministradores([]);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No se proporcionaron IDs');
    });

    it('should handle single string ID', async () => {
      vi.mocked(habilitarUsuario).mockResolvedValue({
        success: true,
        message: 'Usuario habilitado',
      });

      await habilitarAdministradores(validUUID);

      expect(habilitarUsuario).toHaveBeenCalledWith([validUUID]);
    });

    it('should handle array of IDs', async () => {
      const ids = [validUUID, '550e8400-e29b-41d4-a716-446655440001'];
      vi.mocked(habilitarUsuario).mockResolvedValue({
        success: true,
        message: 'Usuarios habilitados',
      });

      await habilitarAdministradores(ids);

      expect(habilitarUsuario).toHaveBeenCalledWith(ids);
    });

    it('should return error for invalid UUID format', async () => {
      const result = await habilitarAdministradores('not-a-uuid');

      expect(result.success).toBe(false);
      expect(result.message).toContain('IDs de usuario no son válidos');
      expect(result.errorIds).toContain('not-a-uuid');
    });

    it('should return error when some IDs are invalid', async () => {
      const result = await habilitarAdministradores([validUUID, 'bad-id', 'another-bad']);

      expect(result.success).toBe(false);
      expect(result.errorIds).toEqual(['bad-id', 'another-bad']);
    });

    it('should call service with valid IDs', async () => {
      vi.mocked(habilitarUsuario).mockResolvedValue({
        success: true,
        message: 'Usuarios habilitados',
      });

      const result = await habilitarAdministradores(validUUID);

      expect(habilitarUsuario).toHaveBeenCalledWith([validUUID]);
      expect(result.success).toBe(true);
    });

    it('should propagate service errors', async () => {
      vi.mocked(habilitarUsuario).mockResolvedValue({
        success: false,
        message: 'Cannot enable ROOT users',
        errorIds: [validUUID],
      });

      const result = await habilitarAdministradores(validUUID);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Cannot enable ROOT users');
    });
  });
});
