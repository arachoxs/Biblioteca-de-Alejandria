import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/models/authModel');
vi.mock('@/services/auth/registrationService');
vi.mock('@/services/admin/auditService');

import {
  getAdminUsers,
  searchAdminUsers,
  getCurrentUser,
} from '@/models/authModel';
import { registerAuthUser } from '@/services/auth/registrationService';
import { logAdminAction } from '@/services/admin/auditService';
import {
  createAdminAccount,
  fetchAdminUsers,
  searchAdmins,
} from '@/services/admin/adminService';
import { createMockRootUser, createMockUser } from '@/__tests__/mocks/auth';
import { mockAdminUsersFromView } from '@/__tests__/mocks/fixtures';
import { Rol } from '@/lib/types/auth';
import { AccionAdministrador } from '@/lib/types/audit';

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── createAdminAccount ────────────────────────────────────────────

  describe('createAdminAccount', () => {
    it('should create admin account successfully with audit log', async () => {
      const rootUser = createMockRootUser();
      vi.mocked(registerAuthUser).mockResolvedValue({
        success: true,
        data: { user: createMockUser({ id: 'new-admin-123' }), session: null },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(rootUser);

      const result = await createAdminAccount('newadmin@example.com');

      expect(result.success).toBe(true);
      expect(result.message).toContain('exitosamente');
      expect(registerAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          correo: 'newadmin@example.com',
        }),
        Rol.ADMINISTRADOR
      );
      expect(logAdminAction).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: rootUser.id,
          action: AccionAdministrador.CREAR,
          description: expect.stringContaining('newadmin@example.com'),
        })
      );
    });

    it('should trim email before processing', async () => {
      vi.mocked(registerAuthUser).mockResolvedValue({
        success: true,
        data: { user: createMockUser({ id: 'trimmed-admin' }), session: null },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(createMockRootUser());

      await createAdminAccount('  spaced@example.com  ');

      expect(registerAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          correo: 'spaced@example.com',
        }),
        Rol.ADMINISTRADOR
      );
    });

    it('should propagate auth registration failure', async () => {
      vi.mocked(registerAuthUser).mockResolvedValue({
        success: false,
        errors: { correo: 'Este correo electrónico ya está registrado.' },
        message: 'Error de registro',
      });

      const result = await createAdminAccount('existing@example.com');

      expect(result.success).toBe(false);
      expect(result.errors?.correo).toContain('ya está registrado');
      expect(logAdminAction).not.toHaveBeenCalled();
    });

    it('should not log audit when no actor is authenticated', async () => {
      vi.mocked(registerAuthUser).mockResolvedValue({
        success: true,
        data: { user: createMockUser({ id: 'admin-no-actor' }), session: null },
      });
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await createAdminAccount('admin@example.com');

      expect(result.success).toBe(true);
      expect(logAdminAction).not.toHaveBeenCalled();
    });

    it('should generate random password for each admin', async () => {
      const passwords: string[] = [];
      vi.mocked(registerAuthUser).mockImplementation(async (creds) => {
        passwords.push(creds.contrasena);
        return {
          success: true,
          data: { user: createMockUser(), session: null },
        };
      });
      vi.mocked(getCurrentUser).mockResolvedValue(createMockRootUser());

      await createAdminAccount('admin1@example.com');
      await createAdminAccount('admin2@example.com');

      expect(passwords[0]).not.toBe(passwords[1]);
      expect(passwords[0].length).toBeGreaterThanOrEqual(12);
    });
  });

  // ─── fetchAdminUsers ───────────────────────────────────────────────

  describe('fetchAdminUsers', () => {
    it('should return paginated admin users successfully', async () => {
      vi.mocked(getAdminUsers).mockResolvedValue({
        data: mockAdminUsersFromView,
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });

      const result = await fetchAdminUsers(1, 10);

      expect(result.success).toBe(true);
      expect(result.data?.data).toEqual(mockAdminUsersFromView);
      expect(result.data?.total).toBe(2);
      expect(getAdminUsers).toHaveBeenCalledWith(1, 10);
    });

    it('should use default pagination values', async () => {
      vi.mocked(getAdminUsers).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      });

      await fetchAdminUsers();

      expect(getAdminUsers).toHaveBeenCalledWith(1, 10);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getAdminUsers).mockRejectedValue(new Error('Database connection failed'));

      const result = await fetchAdminUsers(1, 10);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Database connection failed');
      expect(result.message).toContain('No se pudieron cargar');
    });

    it('should handle unknown errors', async () => {
      vi.mocked(getAdminUsers).mockRejectedValue('Unknown error type');

      const result = await fetchAdminUsers(1, 10);

      expect(result.success).toBe(false);
      expect(result.errors?.form).toBe('Error desconocido');
    });
  });

  // ─── searchAdmins ──────────────────────────────────────────────────

  describe('searchAdmins', () => {
    it('should search admins successfully', async () => {
      vi.mocked(searchAdminUsers).mockResolvedValue(mockAdminUsersFromView);

      const result = await searchAdmins('admin');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockAdminUsersFromView);
      expect(searchAdminUsers).toHaveBeenCalledWith('admin');
    });

    it('should fail with empty search term', async () => {
      const result = await searchAdmins('');

      expect(result.success).toBe(false);
      expect(result.errors?.search).toContain('no puede estar vacío');
      expect(searchAdminUsers).not.toHaveBeenCalled();
    });

    it('should fail with whitespace-only search term', async () => {
      const result = await searchAdmins('   ');

      expect(result.success).toBe(false);
      expect(result.errors?.search).toContain('no puede estar vacío');
      expect(searchAdminUsers).not.toHaveBeenCalled();
    });

    it('should handle search errors gracefully', async () => {
      vi.mocked(searchAdminUsers).mockRejectedValue(new Error('Search index unavailable'));

      const result = await searchAdmins('test');

      expect(result.success).toBe(false);
      expect(result.errors?.form).toContain('Search index unavailable');
      expect(result.message).toContain('No se pudo realizar la búsqueda');
    });

    it('should return empty array for no matches', async () => {
      vi.mocked(searchAdminUsers).mockResolvedValue([]);

      const result = await searchAdmins('nonexistent');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });
});
