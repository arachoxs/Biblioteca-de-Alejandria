import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/models/auditModel');

import { insertAuditLog, getAuditLogs } from '@/models/auditModel';
import { logAdminAction, fetchAuditLogs } from '@/services/admin/auditService';
import { mockAuditoriaRows } from '@/__tests__/mocks/fixtures';
import { AccionAdministrador } from '@/lib/types/audit';

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── logAdminAction ────────────────────────────────────────────────

  describe('logAdminAction', () => {
    it('should insert audit log with correct payload', async () => {
      vi.mocked(insertAuditLog).mockResolvedValue(undefined);

      await logAdminAction({
        actorId: 'actor-123',
        action: AccionAdministrador.CREAR,
        description: 'Se creó el administrador test@example.com.',
        entity: { id_usuario_creado: 'new-user-456', correo: 'test@example.com' },
      });

      expect(insertAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          fecha: expect.any(String),
          accion: AccionAdministrador.CREAR,
          descripcion: 'Se creó el administrador test@example.com.',
          entidad_afectada: { id_usuario_creado: 'new-user-456', correo: 'test@example.com' },
          id_usuario: 'actor-123',
        })
      );
    });

    it('should include ISO timestamp in fecha', async () => {
      vi.mocked(insertAuditLog).mockResolvedValue(undefined);
      const beforeTime = new Date().toISOString();

      await logAdminAction({
        actorId: 'actor-789',
        action: AccionAdministrador.MODIFICAR,
        description: 'Test action',
        entity: {},
      });

      const afterTime = new Date().toISOString();
      const call = vi.mocked(insertAuditLog).mock.calls[0][0];
      
      expect(call.fecha >= beforeTime).toBe(true);
      expect(call.fecha <= afterTime).toBe(true);
    });

    it('should handle ELIMINAR action type', async () => {
      vi.mocked(insertAuditLog).mockResolvedValue(undefined);

      await logAdminAction({
        actorId: 'actor-del',
        action: AccionAdministrador.ELIMINAR,
        description: 'Se eliminó el registro.',
        entity: { id_eliminado: 'deleted-123' },
      });

      expect(insertAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          accion: AccionAdministrador.ELIMINAR,
        })
      );
    });

    it('should not throw when insertAuditLog succeeds', async () => {
      vi.mocked(insertAuditLog).mockResolvedValue(undefined);

      await expect(
        logAdminAction({
          actorId: 'actor-success',
          action: AccionAdministrador.CREAR,
          description: 'Test',
          entity: {},
        })
      ).resolves.not.toThrow();
    });
  });

  // ─── fetchAuditLogs ────────────────────────────────────────────────

  describe('fetchAuditLogs', () => {
    it('should return paginated audit logs successfully', async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
        data: mockAuditoriaRows,
        total: 25,
      });

      const result = await fetchAuditLogs(1, 10);

      expect(result.success).toBe(true);
      expect(result.data?.data).toEqual(mockAuditoriaRows);
      expect(result.data?.total).toBe(25);
      expect(result.data?.page).toBe(1);
      expect(result.data?.pageSize).toBe(10);
      expect(result.data?.totalPages).toBe(3);
      expect(getAuditLogs).toHaveBeenCalledWith(1, 10);
    });

    it('should use default pagination values', async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
        data: [],
        total: 0,
      });

      await fetchAuditLogs();

      expect(getAuditLogs).toHaveBeenCalledWith(1, 10);
    });

    it('should calculate totalPages correctly', async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
        data: mockAuditoriaRows,
        total: 17,
      });

      const result = await fetchAuditLogs(1, 5);

      expect(result.data?.totalPages).toBe(4);
    });

    it('should handle zero results', async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await fetchAuditLogs(1, 10);

      expect(result.success).toBe(true);
      expect(result.data?.data).toEqual([]);
      expect(result.data?.total).toBe(0);
      expect(result.data?.totalPages).toBe(0);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(getAuditLogs).mockRejectedValue(new Error('Database timeout'));

      const result = await fetchAuditLogs(1, 10);

      expect(result.success).toBe(false);
      expect(result.message).toContain('No se pudieron cargar');
    });

    it('should handle non-Error exceptions', async () => {
      vi.mocked(getAuditLogs).mockRejectedValue('Unknown error');

      const result = await fetchAuditLogs(1, 10);

      expect(result.success).toBe(false);
      expect(result.message).toBeDefined();
    });

    it('should enforce minimum page value of 1', async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await fetchAuditLogs(0, 10);

      expect(result.data?.page).toBe(1);
    });

    it('should enforce minimum pageSize of 1', async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await fetchAuditLogs(1, 0);

      expect(result.data?.pageSize).toBe(1);
    });

    it('should handle negative pagination values', async () => {
      vi.mocked(getAuditLogs).mockResolvedValue({
        data: [],
        total: 0,
      });

      const result = await fetchAuditLogs(-5, -10);

      expect(result.data?.page).toBe(1);
      expect(result.data?.pageSize).toBe(1);
    });
  });
});
