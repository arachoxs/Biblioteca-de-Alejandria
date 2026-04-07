/**
 * Global setup for Vitest tests.
 * Configures mocks and environment before tests run.
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Mock server-only package (Next.js specific - no-op in tests)
vi.mock('server-only', () => ({}));

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Suppress console.error/warn in tests unless explicitly needed
if (process.env.VITEST_SILENT !== 'false') {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
}

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GMAIL_USER = 'test@gmail.com';
process.env.CLAVE_APP_GMAIL = 'test-app-password';
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-google-api-key';
