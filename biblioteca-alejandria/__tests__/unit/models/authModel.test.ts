/**
 * Unit tests for authModel.ts
 * Tests authentication-related model functions.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// Mock server-only module
vi.mock('server-only', () => ({}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

// Mock Supabase clients
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
}));

// Mock db-utils
vi.mock('@/lib/validations/db-utils', () => ({
  escapeLikePattern: vi.fn((str: string) => str.replace(/[%_\\]/g, '\\$&')),
  formatILIKE: vi.fn((str: string) => `%${str}%`),
}));

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  signUp,
  adminSignUp,
  signIn,
  setUserRole,
  deleteAuthUser,
  getCurrentUser,
  isCurrentUserRoot,
  getAdminUsers,
  searchAdminUsers,
  globalSignOutModel,
  sendRecoveryCode,
  verifyRecoveryCode,
  resetPassword,
} from '@/models/authModel';
import { createMockUser, createMockRootUser, createMockSession } from '@/__tests__/mocks/auth';
import { mockSupabaseSuccess, mockSupabaseError } from '@/__tests__/mocks/supabase';
import { mockAdminUsersFromView, validCredentials } from '@/__tests__/mocks/fixtures';
import { Rol } from '@/lib/types/auth';

// ─── Helper to create chainable query builder ──────────────────────

function createChainableQueryBuilder(finalResult: { data: unknown; error: unknown; count?: number }) {
  const builder: Record<string, Mock> = {};
  const chainMethods = ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'ilike', 'order', 'range', 'filter', 'or'];
  
  chainMethods.forEach(method => {
    builder[method] = vi.fn().mockReturnThis();
  });
  
  // Terminal methods
  builder.single = vi.fn().mockResolvedValue(finalResult);
  builder.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  
  // select with count
  const originalSelect = builder.select;
  builder.select = vi.fn().mockImplementation(() => {
    return { ...builder, then: () => Promise.resolve({ ...finalResult, count: finalResult.count ?? 0 }) };
  });
  
  return builder;
}

// ─── signUp ────────────────────────────────────────────────────────

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully sign up a new user', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    
    const mockAuth = {
      signUp: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await signUp('test@example.com', 'password123', 'testuser');

    expect(result.success).toBe(true);
    expect(result.data?.user).toBeDefined();
    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      options: { data: { username: 'testuser' } },
    });
  });

  it('should return error when email is already registered', async () => {
    const mockAuth = {
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered', status: 422 },
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await signUp('existing@example.com', 'password123', 'testuser');

    expect(result.success).toBe(false);
    expect(result.errors?.correo).toBe('Este correo electrónico ya está registrado.');
  });

  it('should return generic error for other authentication errors', async () => {
    const mockAuth = {
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Some other error', status: 500 },
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await signUp('test@example.com', 'password123', 'testuser');

    expect(result.success).toBe(false);
    expect(result.errors?.form).toContain('Error en autenticación');
  });
});

// ─── adminSignUp ───────────────────────────────────────────────────

describe('adminSignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create an admin user', async () => {
    const mockUser = createMockUser();
    
    const mockAuth = {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };
    
    vi.mocked(createAdminClient).mockReturnValue({ auth: mockAuth } as never);

    const result = await adminSignUp('admin@example.com', 'password123', 'adminuser');

    expect(result.success).toBe(true);
    expect(result.data?.user).toBeDefined();
    expect(result.data?.session).toBeNull();
    expect(mockAuth.admin.createUser).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { username: 'adminuser' },
    });
  });

  it('should return error when email is already registered', async () => {
    const mockAuth = {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'User already registered', status: 422 },
        }),
      },
    };
    
    vi.mocked(createAdminClient).mockReturnValue({ auth: mockAuth } as never);

    const result = await adminSignUp('existing@example.com', 'password123', 'adminuser');

    expect(result.success).toBe(false);
    expect(result.errors?.correo).toBe('Este correo electrónico ya está registrado.');
  });

  it('should return generic error for other errors', async () => {
    const mockAuth = {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Database error', status: 500 },
        }),
      },
    };
    
    vi.mocked(createAdminClient).mockReturnValue({ auth: mockAuth } as never);

    const result = await adminSignUp('test@example.com', 'password123', 'adminuser');

    expect(result.success).toBe(false);
    expect(result.errors?.form).toContain('Error en autenticación');
  });
});

// ─── signIn ────────────────────────────────────────────────────────

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully sign in a user', async () => {
    const mockUser = createMockUser();
    const mockSession = createMockSession(mockUser);
    
    const mockAuth = {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await signIn('test@example.com', 'password123');

    expect(result).toBeDefined();
    expect(result?.user).toBeDefined();
    expect(result?.session).toBeDefined();
    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should return null when credentials are invalid', async () => {
    const mockAuth = {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials', status: 400 },
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await signIn('wrong@example.com', 'wrongpassword');

    expect(result).toBeNull();
  });
});

// ─── setUserRole ───────────────────────────────────────────────────

describe('setUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully set user role', async () => {
    const mockAuth = {
      admin: {
        updateUserById: vi.fn().mockResolvedValue({
          data: { user: {} },
          error: null,
        }),
      },
    };
    
    vi.mocked(createAdminClient).mockReturnValue({ auth: mockAuth } as never);

    const result = await setUserRole('user-123', Rol.ADMINISTRADOR);

    expect(result.success).toBe(true);
    expect(mockAuth.admin.updateUserById).toHaveBeenCalledWith('user-123', {
      app_metadata: { role: Rol.ADMINISTRADOR },
    });
  });

  it('should return error when update fails', async () => {
    const mockAuth = {
      admin: {
        updateUserById: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Failed to update user' },
        }),
      },
    };
    
    vi.mocked(createAdminClient).mockReturnValue({ auth: mockAuth } as never);

    const result = await setUserRole('user-123', Rol.ADMINISTRADOR);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to update user');
  });
});

// ─── deleteAuthUser ────────────────────────────────────────────────

describe('deleteAuthUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully delete user (silent)', async () => {
    const mockAuth = {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: null }),
      },
    };
    
    vi.mocked(createAdminClient).mockReturnValue({ auth: mockAuth } as never);

    // Should not throw
    await expect(deleteAuthUser('user-123')).resolves.toBeUndefined();
    expect(mockAuth.admin.deleteUser).toHaveBeenCalledWith('user-123');
  });

  it('should handle errors silently', async () => {
    const mockAuth = {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        }),
      },
    };
    
    vi.mocked(createAdminClient).mockReturnValue({ auth: mockAuth } as never);

    // Should not throw even on error
    await expect(deleteAuthUser('user-123')).resolves.toBeUndefined();
  });
});

// ─── getCurrentUser ────────────────────────────────────────────────

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return user when authenticated', async () => {
    const mockUser = createMockUser();
    
    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await getCurrentUser();

    expect(result).toEqual(mockUser);
  });

  it('should return null when no user is authenticated', async () => {
    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await getCurrentUser();

    expect(result).toBeNull();
  });
});

// ─── isCurrentUserRoot ─────────────────────────────────────────────

describe('isCurrentUserRoot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true for ROOT user', async () => {
    const mockUser = createMockRootUser();
    
    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await isCurrentUserRoot();

    expect(result).toBe(true);
  });

  it('should return false for non-ROOT user', async () => {
    const mockUser = createMockUser();
    
    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await isCurrentUserRoot();

    expect(result).toBe(false);
  });

  it('should return false when no user is authenticated', async () => {
    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await isCurrentUserRoot();

    expect(result).toBe(false);
  });
});

// ─── getAdminUsers ─────────────────────────────────────────────────

describe('getAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated admin users', async () => {
    const mockData = mockAdminUsersFromView;
    
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
        count: mockData.length,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await getAdminUsers(1, 10);

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(10);
    expect(mockClient.from).toHaveBeenCalledWith('vista_administradores');
  });

  it('should handle pagination correctly', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await getAdminUsers(2, 5);

    expect(queryBuilder.range).toHaveBeenCalledWith(5, 9); // page 2, pageSize 5
  });

  it('should throw on database error', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await expect(getAdminUsers(1, 10)).rejects.toThrow();
  });
});

// ─── searchAdminUsers ──────────────────────────────────────────────

describe('searchAdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return search results', async () => {
    const mockData = mockAdminUsersFromView;
    
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    const result = await searchAdminUsers('admin');

    expect(result).toHaveLength(2);
    expect(mockClient.from).toHaveBeenCalledWith('vista_administradores');
    expect(queryBuilder.or).toHaveBeenCalled();
  });

  it('should throw on database error', async () => {
    const queryBuilder = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Search failed' },
      }),
    };
    
    const mockClient = {
      from: vi.fn().mockReturnValue(queryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockClient as never);

    await expect(searchAdminUsers('admin')).rejects.toThrow();
  });
});

// ─── globalSignOutModel ────────────────────────────────────────────

describe('globalSignOutModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sign out and redirect', async () => {
    const mockAuth = {
      signOut: vi.fn().mockResolvedValue({ error: null }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);
    vi.mocked(redirect).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(globalSignOutModel()).rejects.toThrow('NEXT_REDIRECT');
    expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: 'global' });
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('should throw on sign out error', async () => {
    const mockAuth = {
      signOut: vi.fn().mockResolvedValue({
        error: { message: 'Sign out failed' },
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    await expect(globalSignOutModel()).rejects.toEqual({ message: 'Sign out failed' });
  });
});

// ─── sendRecoveryCode ──────────────────────────────────────────────

describe('sendRecoveryCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should always return success for security (non-disabled accounts)', async () => {
    // Admin client mock for checking disabled status
    const adminQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
    };
    
    const mockAdminClient = {
      from: vi.fn().mockReturnValue(adminQueryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as never);
    
    // Client mock for resetPasswordForEmail
    const mockAuth = {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await sendRecoveryCode('test@example.com');

    expect(result.success).toBe(true);
    expect(result.message).toContain('Si el correo está registrado');
  });

  it('should return error for disabled admin account', async () => {
    const adminQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { habilitado: false },
        error: null,
      }),
    };
    
    const mockAdminClient = {
      from: vi.fn().mockReturnValue(adminQueryBuilder),
    };
    
    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient as never);

    const result = await sendRecoveryCode('disabled@example.com');

    expect(result.error).toContain('cuenta ha sido deshabilitada');
  });
});

// ─── verifyRecoveryCode ────────────────────────────────────────────

describe('verifyRecoveryCode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success on valid code', async () => {
    const mockAuth = {
      verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await verifyRecoveryCode('test@example.com', '123456');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Código verificado correctamente.');
    expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      token: '123456',
      type: 'recovery',
    });
  });

  it('should return error for expired code', async () => {
    const mockAuth = {
      verifyOtp: vi.fn().mockResolvedValue({
        error: { message: 'Token has expired' },
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await verifyRecoveryCode('test@example.com', '123456');

    expect(result.error).toBe('No se pudo validar el código ingresado.');
  });

  it('should return error for incorrect code', async () => {
    const mockAuth = {
      verifyOtp: vi.fn().mockResolvedValue({
        error: { message: 'Invalid token' },
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await verifyRecoveryCode('test@example.com', 'wrong');

    expect(result.error).toBe('El código ingresado es incorrecto.');
  });
});

// ─── resetPassword ─────────────────────────────────────────────────

describe('resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully reset password', async () => {
    const mockUser = createMockUser();
    
    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await resetPassword('newPassword123');

    expect(result.success).toBe(true);
    expect(result.message).toBe('Contraseña actualizada exitosamente.');
    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: 'newPassword123' });
  });

  it('should return error when no user session', async () => {
    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await resetPassword('newPassword123');

    expect(result.error).toContain('sesión ha expirado');
  });

  it('should return error when getUser fails', async () => {
    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Session error' },
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await resetPassword('newPassword123');

    expect(result.error).toContain('No se pudo verificar tu sesión');
  });

  it('should return error when updateUser fails', async () => {
    const mockUser = createMockUser();
    
    const mockAuth = {
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        error: { message: 'Update failed' },
      }),
    };
    
    vi.mocked(createClient).mockResolvedValue({ auth: mockAuth } as never);

    const result = await resetPassword('newPassword123');

    expect(result.error).toContain('No se pudo actualizar la contraseña');
  });
});
