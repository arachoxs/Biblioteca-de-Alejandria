/**
 * Database cleanup utilities for integration tests.
 * Removes test data between tests to ensure isolation.
 */

import { createTestAdminClient } from './supabase-test-client';

const TEST_EMAIL_PATTERN = '%@test.example.com';
const TEST_DNI_PATTERN = 'TEST%';

/**
 * Cleans up all test data created during integration tests.
 * Should be called in afterEach or afterAll hooks.
 */
export async function cleanupTestData() {
  const adminClient = createTestAdminClient();

  try {
    // 1. Get test users from auth.users
    const { data: testUsers } = await adminClient.auth.admin.listUsers();
    const testUserIds = testUsers?.users
      .filter(u => u.email?.includes('@test.example.com'))
      .map(u => u.id) ?? [];

    // 2. Delete user profiles (cascades to addresses via FK)
    if (testUserIds.length > 0) {
      await adminClient
        .from('usuario')
        .delete()
        .in('id', testUserIds);
    }

    // 3. Delete orphaned test addresses
    await adminClient
      .from('direccion')
      .delete()
      .like('direccion_formateada', '%Test Address%');

    // 4. Delete test audit logs
    await adminClient
      .from('auditoria')
      .delete()
      .like('descripcion', '%test%');

    // 5. Delete test auth users
    for (const userId of testUserIds) {
      await adminClient.auth.admin.deleteUser(userId);
    }

    console.log(`Cleaned up ${testUserIds.length} test users`);
  } catch (error) {
    console.error('Error during test cleanup:', error);
    // Don't throw - cleanup failures shouldn't fail tests
  }
}

/**
 * Deletes a specific test user and their data.
 */
export async function cleanupTestUser(userId: string) {
  const adminClient = createTestAdminClient();

  try {
    // Delete profile (may cascade)
    await adminClient.from('usuario').delete().eq('id', userId);
    
    // Delete auth user
    await adminClient.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error(`Error cleaning up user ${userId}:`, error);
  }
}

/**
 * Generates a unique test email to avoid conflicts.
 */
export function generateTestEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@test.example.com`;
}

/**
 * Generates a unique test DNI.
 */
export function generateTestDni(): string {
  const timestamp = Date.now().toString().slice(-8);
  return `TEST${timestamp}`;
}

/**
 * Generates a unique test username.
 */
export function generateTestUsername(): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `testuser_${random}`;
}
