/**
 * Supabase test client for integration tests.
 * Uses the local Supabase instance.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';

const SUPABASE_URL = process.env.SUPABASE_TEST_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.SUPABASE_TEST_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_TEST_SERVICE_KEY || '';

/**
 * Creates a Supabase client for integration tests (anon role).
 */
export function createTestClient() {
  if (!SUPABASE_ANON_KEY) {
    throw new Error(
      'SUPABASE_TEST_ANON_KEY not set. Run `supabase start` and set the env var.'
    );
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}

/**
 * Creates a Supabase admin client for integration tests (service role).
 */
export function createTestAdminClient() {
  if (!SUPABASE_SERVICE_KEY) {
    throw new Error(
      'SUPABASE_TEST_SERVICE_KEY not set. Run `supabase start` and set the env var.'
    );
  }
  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Checks if Supabase local is available for integration tests.
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: { apikey: SUPABASE_ANON_KEY },
    });
    return response.ok;
  } catch {
    return false;
  }
}
