/**
 * Unit tests for userModel.ts
 * Tests user profile-related model functions.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from '@/lib/supabase/server';
import {
  getUserProfileById,
  updateUserProfile,
  checkDniExists,
  checkUsernameExists,
  createUserProfile,
  deleteUserProfile,
} from '@/models/userModel';
import { mockRawUserProfile, validPersonalData } from '@/__tests__/mocks/fixtures';
import { Genero } from '@/lib/types/auth';

// ─── getUserProfileById ────────────────────────────────────────────

describe('getUserProfileById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user profile when user exists', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: mockRawUserProfile,
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await getUserProfileById('user-123');

    expect(result).toEqual(mockRawUserProfile);
    expect(mockClient.from).toHaveBeenCalledWith('usuario');
    expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('should return null when user does not exist', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await getUserProfileById('nonexistent-user');

    expect(result).toBeNull();
  });

  it('should throw error on database error', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST' },
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await expect(getUserProfileById('user-123')).rejects.toEqual({
      message: 'Database error',
      code: 'PGRST',
    });
  });
});

// ─── updateUserProfile ─────────────────────────────────────────────

describe('updateUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully update user profile', async () => {
    const queryBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const updateData = {
      nombres: 'Updated Name',
      apellidos: 'Updated Surname',
      genero: Genero.Masculino,
    };

    const result = await updateUserProfile('user-123', updateData);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith('usuario');
    expect(queryBuilder.update).toHaveBeenCalledWith({
      nombres: 'Updated Name',
      apellidos: 'Updated Surname',
      genero: Genero.Masculino,
    });
    expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('should include id_direccion when provided', async () => {
    const queryBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const updateData = {
      nombres: 'Updated Name',
      apellidos: 'Updated Surname',
      genero: Genero.Femenino,
      id_direccion: 42,
    };

    const result = await updateUserProfile('user-123', updateData);

    expect(result.success).toBe(true);
    expect(queryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
      id_direccion: 42,
    }));
  });

  it('should return error on database error', async () => {
    const queryBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const updateData = {
      nombres: 'Updated Name',
      apellidos: 'Updated Surname',
      genero: Genero.Masculino,
    };

    const result = await updateUserProfile('user-123', updateData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Update failed');
  });
});

// ─── checkDniExists ────────────────────────────────────────────────

describe('checkDniExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when DNI exists', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { dni: '12345678A' },
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await checkDniExists('12345678A');

    expect(result).toBe(true);
    expect(mockClient.from).toHaveBeenCalledWith('usuario');
    expect(queryBuilder.select).toHaveBeenCalledWith('dni');
    expect(queryBuilder.eq).toHaveBeenCalledWith('dni', '12345678A');
  });

  it('should return false when DNI does not exist', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await checkDniExists('nonexistent');

    expect(result).toBe(false);
  });

  it('should throw error on database error', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await expect(checkDniExists('12345678A')).rejects.toEqual({
      message: 'Database error',
    });
  });
});

// ─── checkUsernameExists ───────────────────────────────────────────

describe('checkUsernameExists', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return exists=true when username exists', async () => {
    const mockClient = {
      rpc: vi.fn().mockResolvedValue({
        data: true,
        error: null,
      }),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await checkUsernameExists('existinguser');

    expect(result.exists).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockClient.rpc).toHaveBeenCalledWith('check_username_exists', {
      username_check: 'existinguser',
    });
  });

  it('should return exists=false when username does not exist', async () => {
    const mockClient = {
      rpc: vi.fn().mockResolvedValue({
        data: false,
        error: null,
      }),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await checkUsernameExists('newuser');

    expect(result.exists).toBe(false);
    expect(result.error).toBeUndefined();
  });

  it('should return error on RPC error', async () => {
    const mockClient = {
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'RPC function failed' },
      }),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await checkUsernameExists('testuser');

    expect(result.exists).toBe(false);
    expect(result.error).toBe('RPC function failed');
  });
});

// ─── createUserProfile ─────────────────────────────────────────────

describe('createUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create user profile (upsert)', async () => {
    const queryBuilder = {
      upsert: vi.fn().mockResolvedValue({
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await createUserProfile('user-123', validPersonalData, 1);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith('usuario');
    expect(queryBuilder.upsert).toHaveBeenCalledWith({
      id: 'user-123',
      dni: validPersonalData.dni,
      nombres: validPersonalData.nombres,
      apellidos: validPersonalData.apellidos,
      fecha_nacimiento: validPersonalData.fecha_nacimiento,
      lugar_nacimiento: validPersonalData.lugar_nacimiento,
      genero: validPersonalData.genero,
      id_direccion: 1,
    });
  });

  it('should return error on database error', async () => {
    const queryBuilder = {
      upsert: vi.fn().mockResolvedValue({
        error: { message: 'Upsert failed' },
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await createUserProfile('user-123', validPersonalData, 1);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Upsert failed');
  });
});

// ─── deleteUserProfile ─────────────────────────────────────────────

describe('deleteUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully delete user profile', async () => {
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

    const result = await deleteUserProfile('user-123');

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockClient.from).toHaveBeenCalledWith('usuario');
    expect(queryBuilder.delete).toHaveBeenCalled();
    expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'user-123');
  });

  it('should return error on database error', async () => {
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

    const result = await deleteUserProfile('user-123');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Delete failed');
  });
});
