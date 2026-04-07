import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('@/services/admin/auditService', () => ({
  fetchAuditLogs: vi.fn(),
}));

import { getAuditLogsAction } from '@/app/(panel)/panel-root/auditoria/action';
import { fetchAuditLogs } from '@/services/admin/auditService';

describe('getAuditLogsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call fetchAuditLogs with default pagination', async () => {
    vi.mocked(fetchAuditLogs).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
    });

    await getAuditLogsAction();

    expect(fetchAuditLogs).toHaveBeenCalledWith(1, 10);
  });

  it('should call fetchAuditLogs with custom pagination', async () => {
    vi.mocked(fetchAuditLogs).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 3, pageSize: 50, totalPages: 0 },
    });

    await getAuditLogsAction(3, 50);

    expect(fetchAuditLogs).toHaveBeenCalledWith(3, 50);
  });

  it('should return paginated audit logs', async () => {
    const mockLogs = {
      success: true,
      data: {
        data: [
          {
            id: 1,
            fecha: '2024-01-15T10:30:00Z',
            accion: 'crear',
            descripcion: 'Creó un nuevo administrador',
            usuario_id: 'user-123',
            entidad_afectada: { type: 'admin', id: 'admin-456' },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      },
    };
    vi.mocked(fetchAuditLogs).mockResolvedValue(mockLogs as never);

    const result = await getAuditLogsAction();

    expect(result).toEqual(mockLogs);
  });

  it('should return error response from service', async () => {
    vi.mocked(fetchAuditLogs).mockResolvedValue({
      success: false,
      errors: { form: 'No tienes permisos para ver auditoría' },
    });

    const result = await getAuditLogsAction();

    expect(result.success).toBe(false);
    expect(result.errors?.form).toContain('permisos');
  });

  it('should pass through empty results', async () => {
    vi.mocked(fetchAuditLogs).mockResolvedValue({
      success: true,
      data: { data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 },
    });

    const result = await getAuditLogsAction();

    expect(result.success).toBe(true);
    expect(result.data?.data).toEqual([]);
    expect(result.data?.total).toBe(0);
  });

  it('should handle page beyond available data', async () => {
    vi.mocked(fetchAuditLogs).mockResolvedValue({
      success: true,
      data: { data: [], total: 5, page: 10, pageSize: 10, totalPages: 1 },
    });

    const result = await getAuditLogsAction(10, 10);

    expect(result.success).toBe(true);
    expect(result.data?.data).toEqual([]);
  });
});
