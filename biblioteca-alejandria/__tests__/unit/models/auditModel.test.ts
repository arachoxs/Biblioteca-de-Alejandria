/**
 * Unit tests for auditModel.ts
 * Tests audit logging model functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/server';
import { insertAuditLog, getAuditLogs } from '@/models/auditModel';
import { mockAuditLogPayload, mockAuditoriaRows } from '@/__tests__/mocks/fixtures';

// ─── insertAuditLog ────────────────────────────────────────────────

describe('insertAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully insert audit log', async () => {
    const queryBuilder = {
      insert: vi.fn().mockResolvedValue({
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await insertAuditLog(mockAuditLogPayload);

    expect(mockClient.from).toHaveBeenCalledWith('auditoria');
    expect(queryBuilder.insert).toHaveBeenCalledWith({
      fecha: mockAuditLogPayload.fecha,
      accion: mockAuditLogPayload.accion,
      descripcion: mockAuditLogPayload.descripcion,
      entidad_afectada: mockAuditLogPayload.entidad_afectada,
      id_usuario: mockAuditLogPayload.id_usuario,
    });
  });

  it('should not throw on database error (silent)', async () => {
    const queryBuilder = {
      insert: vi.fn().mockResolvedValue({
        error: { message: 'Insert failed' },
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    // Should not throw
    await expect(insertAuditLog(mockAuditLogPayload)).resolves.toBeUndefined();
  });

  it('should handle exceptions silently', async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error('Connection error');
    });

    // Should not throw even on exception
    await expect(insertAuditLog(mockAuditLogPayload)).resolves.toBeUndefined();
  });
});

// ─── getAuditLogs ──────────────────────────────────────────────────

describe('getAuditLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated audit logs', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: mockAuditoriaRows,
        error: null,
        count: mockAuditoriaRows.length,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await getAuditLogs(1, 10);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(mockClient.from).toHaveBeenCalledWith('auditoria');
    expect(queryBuilder.select).toHaveBeenCalledWith('*', { count: 'exact' });
    expect(queryBuilder.order).toHaveBeenCalledWith('fecha', { ascending: false });
    expect(queryBuilder.range).toHaveBeenCalledWith(0, 9); // page 1, pageSize 10
  });

  it('should handle pagination correctly for page 2', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 25,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await getAuditLogs(2, 10);

    expect(queryBuilder.range).toHaveBeenCalledWith(10, 19); // page 2, pageSize 10
  });

  it('should handle custom page size', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await getAuditLogs(1, 5);

    expect(queryBuilder.range).toHaveBeenCalledWith(0, 4); // page 1, pageSize 5
  });

  it('should use default values when not provided', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await getAuditLogs();

    expect(queryBuilder.range).toHaveBeenCalledWith(0, 9); // default page 1, pageSize 10
  });

  it('should handle negative page/pageSize gracefully', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await getAuditLogs(-1, -5);

    // Should use Math.max(1, page/pageSize) = 1
    expect(queryBuilder.range).toHaveBeenCalledWith(0, 0); // page 1, pageSize 1
  });

  it('should throw on database error', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Query failed' },
        count: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await expect(getAuditLogs(1, 10)).rejects.toEqual({
      message: 'Query failed',
    });
  });

  it('should return empty array and zero total when no data', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: null,
        error: null,
        count: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await getAuditLogs(1, 10);

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });
});
