import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock authModel before importing action
vi.mock('@/models/authModel', () => ({
  signIn: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

import { loginAction } from '@/app/(auth)/login/actions';
import { signIn } from '@/models/authModel';
import { redirect } from 'next/navigation';
import { Rol } from '@/lib/types/auth';

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validation', () => {
    it('should return error for empty email', async () => {
      const result = await loginAction('', 'password123');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('correo electrónico');
    });

    it('should return error for invalid email format', async () => {
      const result = await loginAction('invalid-email', 'password123');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('correo');
    });

    it('should return error for empty password', async () => {
      const result = await loginAction('test@example.com', '');
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('contraseña');
    });

    it('should sanitize email before validation', async () => {
      vi.mocked(signIn).mockResolvedValue(null);
      
      await loginAction('  test@example.com  ', 'password123');
      
      expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  describe('authentication', () => {
    it('should return error when signIn returns null', async () => {
      vi.mocked(signIn).mockResolvedValue(null);

      const result = await loginAction('test@example.com', 'password123');

      expect(signIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result).toHaveProperty('error');
      expect(result.error).toBe('Usuario o contraseña incorrectos.');
    });

    it('should redirect to panel-root for ROOT role', async () => {
      vi.mocked(signIn).mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { role: Rol.ROOT },
        },
        session: { access_token: 'token' },
      } as never);

      await expect(loginAction('root@example.com', 'password123'))
        .rejects.toThrow('REDIRECT:/panel-root');

      expect(redirect).toHaveBeenCalledWith('/panel-root');
    });

    it('should redirect to panel-admin for ADMINISTRADOR role', async () => {
      vi.mocked(signIn).mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { role: Rol.ADMINISTRADOR },
        },
        session: { access_token: 'token' },
      } as never);

      await expect(loginAction('admin@example.com', 'password123'))
        .rejects.toThrow('REDIRECT:/panel-admin');

      expect(redirect).toHaveBeenCalledWith('/panel-admin');
    });

    it('should redirect to home for CLIENTE role', async () => {
      vi.mocked(signIn).mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: { role: Rol.CLIENTE },
        },
        session: { access_token: 'token' },
      } as never);

      await expect(loginAction('cliente@example.com', 'password123'))
        .rejects.toThrow('REDIRECT:/');

      expect(redirect).toHaveBeenCalledWith('/');
    });

    it('should redirect to home when role is undefined', async () => {
      vi.mocked(signIn).mockResolvedValue({
        user: {
          id: 'user-1',
          app_metadata: {},
        },
        session: { access_token: 'token' },
      } as never);

      await expect(loginAction('user@example.com', 'password123'))
        .rejects.toThrow('REDIRECT:/');

      expect(redirect).toHaveBeenCalledWith('/');
    });
  });
});
