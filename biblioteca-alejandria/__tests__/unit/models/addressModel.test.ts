/**
 * Unit tests for addressModel.ts
 * Tests address-related model functions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/server';
import {
  createAddress,
  deleteAddress,
  updateAddress,
} from '@/models/addressModel';
import { validAddressInput } from '@/__tests__/mocks/fixtures';

// ─── createAddress ─────────────────────────────────────────────────

describe('createAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create address and return id', async () => {
    const queryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 42 },
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await createAddress(validAddressInput);

    expect(result.success).toBe(true);
    expect(result.id).toBe(42);
    expect(result.error).toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith('direccion');
    expect(queryBuilder.insert).toHaveBeenCalledWith({
      direccion_formateada: validAddressInput.direccion,
      place_id: validAddressInput.placeId,
      detalle_direccion: validAddressInput.detalle,
    });
    expect(queryBuilder.select).toHaveBeenCalledWith('id');
  });

  it('should handle missing detalle as null', async () => {
    const queryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 43 },
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const inputWithoutDetalle = {
      direccion: 'Test Address',
      placeId: 'test-place-id',
    };

    const result = await createAddress(inputWithoutDetalle);

    expect(result.success).toBe(true);
    expect(queryBuilder.insert).toHaveBeenCalledWith({
      direccion_formateada: 'Test Address',
      place_id: 'test-place-id',
      detalle_direccion: null,
    });
  });

  it('should return error on database error', async () => {
    const queryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await createAddress(validAddressInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed');
    expect(result.id).toBeUndefined();
  });
});

// ─── deleteAddress ─────────────────────────────────────────────────

describe('deleteAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully delete address (silent)', async () => {
    const queryBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await deleteAddress(42);

    expect(mockClient.from).toHaveBeenCalledWith('direccion');
    expect(queryBuilder.delete).toHaveBeenCalled();
    expect(queryBuilder.eq).toHaveBeenCalledWith('id', 42);
  });

  it('should handle errors silently', async () => {
    const queryBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: { message: 'Delete failed' },
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    // Should not throw
    await expect(deleteAddress(42)).resolves.toBeUndefined();
  });
});

// ─── updateAddress ─────────────────────────────────────────────────

describe('updateAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update address', async () => {
    const queryBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 42 },
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await updateAddress(42, validAddressInput);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith('direccion');
    expect(queryBuilder.update).toHaveBeenCalledWith({
      direccion_formateada: validAddressInput.direccion,
      place_id: validAddressInput.placeId,
      detalle_direccion: validAddressInput.detalle,
    });
    expect(queryBuilder.eq).toHaveBeenCalledWith('id', 42);
  });

  it('should return error when address not found', async () => {
    const queryBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await updateAddress(999, validAddressInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Dirección no encontrada');
  });

  it('should return error on database error', async () => {
    const queryBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await updateAddress(42, validAddressInput);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Update failed');
  });

  it('should handle missing detalle as null', async () => {
    const queryBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 42 },
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const inputWithoutDetalle = {
      direccion: 'Updated Address',
      placeId: 'updated-place-id',
    };

    const result = await updateAddress(42, inputWithoutDetalle);

    expect(result.success).toBe(true);
    expect(queryBuilder.update).toHaveBeenCalledWith({
      direccion_formateada: 'Updated Address',
      place_id: 'updated-place-id',
      detalle_direccion: null,
    });
  });
});
