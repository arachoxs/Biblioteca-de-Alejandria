/**
 * Mock for Supabase clients used in tests.
 * Provides vi.fn() implementations for all Supabase operations.
 */

import { vi } from 'vitest';
import type { User, Session, AuthResponse } from '@supabase/supabase-js';

// ─── Mock Response Builders ────────────────────────────────────────

export function mockSupabaseSuccess<T>(data: T) {
  return { data, error: null };
}

export function mockSupabaseError(message: string, status = 400) {
  return {
    data: null,
    error: { message, status, name: 'PostgrestError' }
  };
}

// ─── Auth Mock Methods ─────────────────────────────────────────────

export const createMockAuthMethods = () => ({
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  verifyOtp: vi.fn(),
  admin: {
    createUser: vi.fn(),
    deleteUser: vi.fn(),
    updateUserById: vi.fn(),
    getUserById: vi.fn(),
    listUsers: vi.fn(),
  }
});

// ─── Query Builder Mock ────────────────────────────────────────────

export const createMockQueryBuilder = () => {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  
  // Chain methods that return the builder
  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
    'like', 'ilike', 'is', 'in', 'contains',
    'order', 'limit', 'range', 'filter', 'or'
  ];
  
  chainMethods.forEach(method => {
    builder[method] = vi.fn().mockReturnThis();
  });
  
  // Terminal methods that resolve the query
  builder.single = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.execute = vi.fn().mockResolvedValue({ data: [], error: null, count: 0 });
  
  return builder;
};

// ─── Full Client Mock ──────────────────────────────────────────────

export const createMockSupabaseClient = () => {
  const queryBuilder = createMockQueryBuilder();
  
  return {
    auth: createMockAuthMethods(),
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    _queryBuilder: queryBuilder, // Exposed for test assertions
  };
};

// ─── Module Mocks ──────────────────────────────────────────────────

/**
 * Use this to mock the Supabase server module.
 * Call vi.mock('@/lib/supabase/server', ...) with this factory.
 */
export const mockSupabaseServerModule = () => {
  const mockClient = createMockSupabaseClient();
  const mockAdminClient = createMockSupabaseClient();
  
  return {
    createClient: vi.fn().mockResolvedValue(mockClient),
    createAdminClient: vi.fn().mockReturnValue(mockAdminClient),
    _mockClient: mockClient,
    _mockAdminClient: mockAdminClient,
  };
};

// ─── Helper to setup common mocks ──────────────────────────────────

export function setupSupabaseMocks() {
  const serverModule = mockSupabaseServerModule();
  
  vi.mock('@/lib/supabase/server', () => ({
    createClient: serverModule.createClient,
    createAdminClient: serverModule.createAdminClient,
  }));
  
  return serverModule;
}
