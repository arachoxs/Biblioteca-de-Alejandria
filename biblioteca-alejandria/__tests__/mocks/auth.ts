/**
 * Mock authentication data for tests.
 * Provides factory functions for User, Session, and auth responses.
 */

import type { User, Session, AuthResponse } from '@supabase/supabase-js';
import { Rol, Genero } from '@/lib/types/auth';

// ─── User Factories ────────────────────────────────────────────────

export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id-123',
    email: 'test@example.com',
    phone: null,
    app_metadata: {
      provider: 'email',
      role: Rol.CLIENTE,
    },
    user_metadata: {
      username: 'testuser',
    },
    aud: 'authenticated',
    confirmation_sent_at: undefined,
    recovery_sent_at: undefined,
    email_change_sent_at: undefined,
    new_email: undefined,
    new_phone: undefined,
    invited_at: undefined,
    action_link: undefined,
    created_at: '2024-01-01T00:00:00.000Z',
    confirmed_at: '2024-01-01T00:00:00.000Z',
    email_confirmed_at: '2024-01-01T00:00:00.000Z',
    phone_confirmed_at: undefined,
    last_sign_in_at: '2024-01-01T00:00:00.000Z',
    role: 'authenticated',
    updated_at: '2024-01-01T00:00:00.000Z',
    identities: [],
    is_anonymous: false,
    factors: [],
    ...overrides,
  };
}

export function createMockAdminUser(overrides: Partial<User> = {}): User {
  return createMockUser({
    id: 'admin-user-id-456',
    email: 'admin@example.com',
    app_metadata: {
      provider: 'email',
      role: Rol.ADMINISTRADOR,
    },
    user_metadata: {
      username: 'adminuser',
    },
    ...overrides,
  });
}

export function createMockRootUser(overrides: Partial<User> = {}): User {
  return createMockUser({
    id: 'root-user-id-789',
    email: 'root@example.com',
    app_metadata: {
      provider: 'email',
      role: Rol.ROOT,
    },
    user_metadata: {
      username: 'rootuser',
    },
    ...overrides,
  });
}

// ─── Session Factory ───────────────────────────────────────────────

export function createMockSession(user?: User, overrides: Partial<Session> = {}): Session {
  const sessionUser = user ?? createMockUser();
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user: sessionUser,
    ...overrides,
  };
}

// ─── Auth Response Factories ───────────────────────────────────────

export function createMockAuthResponse(
  user?: User,
  session?: Session
): AuthResponse {
  const responseUser = user ?? createMockUser();
  const responseSession = session ?? createMockSession(responseUser);
  
  return {
    data: {
      user: responseUser,
      session: responseSession,
    },
    error: null,
  };
}

export function createMockAuthError(message: string, status = 400): AuthResponse {
  return {
    data: {
      user: null,
      session: null,
    },
    error: {
      message,
      status,
      name: 'AuthError',
    } as AuthResponse['error'],
  };
}

// ─── Signup Response (no session) ──────────────────────────────────

export function createMockSignUpResponse(user?: User) {
  return {
    data: {
      user: user ?? createMockUser(),
      session: null, // No session on signup until email confirmed
    },
    error: null,
  };
}
