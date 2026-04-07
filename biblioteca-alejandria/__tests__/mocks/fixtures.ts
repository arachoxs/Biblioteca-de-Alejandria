/**
 * Test fixtures - reusable test data for all tests.
 */

import { Genero, Rol } from '@/lib/types/auth';
import type { CredentialData, PersonalData } from '@/lib/types/auth';
import type { FullProfilePayload, ProfileUpdatePayload, UserProfileData } from '@/lib/types/profile';
import type { AuditLogPayload, AuditoriaRow } from '@/lib/types/audit';
import { AccionAdministrador } from '@/lib/types/audit';

// ─── Credential Data ───────────────────────────────────────────────

export const validCredentials: CredentialData = {
  correo: 'test@example.com',
  contrasena: 'SecurePass123!',
  confirmar_contrasena: 'SecurePass123!',
};

export const invalidCredentials = {
  emptyEmail: { ...validCredentials, correo: '' },
  invalidEmail: { ...validCredentials, correo: 'not-an-email' },
  weakPassword: { ...validCredentials, contrasena: '123', confirmar_contrasena: '123' },
  mismatchedPasswords: { ...validCredentials, confirmar_contrasena: 'DifferentPass123!' },
};

// ─── Personal Data ─────────────────────────────────────────────────

export const validPersonalData: PersonalData = {
  dni: '12345678A',
  nombres: 'Juan Carlos',
  apellidos: 'García López',
  fecha_nacimiento: '1990-05-15',
  lugar_nacimiento: 'Madrid, España',
  genero: Genero.Masculino,
  direccion: 'Calle Principal 123, Madrid, España',
  direccion_place_id: 'ChIJgTwKgJcpQg0RaSKMYcHeNsQ',
  direccion_detalle: 'Piso 3, Puerta B',
  usuario: 'juancarlos',
};

export const invalidPersonalData = {
  emptyDni: { ...validPersonalData, dni: '' },
  shortDni: { ...validPersonalData, dni: '123' },
  emptyNombres: { ...validPersonalData, nombres: '' },
  emptyApellidos: { ...validPersonalData, apellidos: '' },
  invalidFechaNacimiento: { ...validPersonalData, fecha_nacimiento: 'invalid-date' },
  futureFechaNacimiento: { ...validPersonalData, fecha_nacimiento: '2099-01-01' },
  emptyDireccion: { ...validPersonalData, direccion: '' },
  emptyPlaceId: { ...validPersonalData, direccion_place_id: '' },
  emptyUsuario: { ...validPersonalData, usuario: '' },
  shortUsuario: { ...validPersonalData, usuario: 'ab' },
};

// ─── Profile Payloads ──────────────────────────────────────────────

export const validFullProfilePayload: FullProfilePayload = {
  dni: '12345678A',
  nombres: 'Juan Carlos',
  apellidos: 'García López',
  fecha_nacimiento: '1990-05-15',
  lugar_nacimiento: 'Madrid, España',
  genero: Genero.Masculino,
  usuario: 'juancarlos',
  direccion: 'Calle Principal 123, Madrid, España',
  direccion_place_id: 'ChIJgTwKgJcpQg0RaSKMYcHeNsQ',
  direccion_detalle: 'Piso 3, Puerta B',
};

export const validProfileUpdatePayload: ProfileUpdatePayload = {
  nombres: 'Juan Carlos',
  apellidos: 'García López',
  genero: Genero.Masculino,
  usuario: 'juancarlos',
  direccion: 'Nueva Calle 456, Barcelona, España',
  direccion_place_id: 'ChIJE4hZqKylpBIR1E2WRcko_mo',
  direccion_detalle: 'Local 1',
};

// ─── User Profile Data (from DB) ───────────────────────────────────

export const mockUserProfileData: UserProfileData = {
  dni: '12345678A',
  nombres: 'Juan Carlos',
  apellidos: 'García López',
  fecha_nacimiento: '1990-05-15',
  lugar_nacimiento: 'Madrid, España',
  genero: Genero.Masculino,
  id_direccion: 1,
  direccion_formateada: 'Calle Principal 123, Madrid, España',
  direccion_place_id: 'ChIJgTwKgJcpQg0RaSKMYcHeNsQ',
  direccion_detalle: 'Piso 3, Puerta B',
  correo: 'test@example.com',
  usuario: 'juancarlos',
};

// ─── Raw User Profile (from Model) ─────────────────────────────────

export const mockRawUserProfile = {
  dni: '12345678A',
  nombres: 'Juan Carlos',
  apellidos: 'García López',
  fecha_nacimiento: '1990-05-15',
  lugar_nacimiento: 'Madrid, España',
  genero: Genero.Masculino,
  id_direccion: 1,
  direccion: {
    direccion_formateada: 'Calle Principal 123, Madrid, España',
    place_id: 'ChIJgTwKgJcpQg0RaSKMYcHeNsQ',
    detalle_direccion: 'Piso 3, Puerta B',
  },
};

// ─── Address Data ──────────────────────────────────────────────────

export const validAddressInput = {
  direccion: 'Calle Principal 123, Madrid, España',
  placeId: 'ChIJgTwKgJcpQg0RaSKMYcHeNsQ',
  detalle: 'Piso 3, Puerta B',
};

// ─── Audit Data ────────────────────────────────────────────────────

export const mockAuditLogPayload: AuditLogPayload = {
  fecha: '2024-01-01T12:00:00.000Z',
  accion: AccionAdministrador.CREAR,
  descripcion: 'Se creó el administrador test@example.com.',
  entidad_afectada: { id_usuario_creado: 'user-123', correo: 'test@example.com' },
  id_usuario: 'actor-456',
};

export const mockAuditoriaRow: AuditoriaRow = {
  id: 1,
  fecha: '2024-01-01T12:00:00.000Z',
  accion: AccionAdministrador.CREAR,
  descripcion: 'Se creó el administrador test@example.com.',
  entidad_afectada: { id_usuario_creado: 'user-123', correo: 'test@example.com' },
  id_usuario: 'actor-456',
};

export const mockAuditoriaRows: AuditoriaRow[] = [
  mockAuditoriaRow,
  {
    id: 2,
    fecha: '2024-01-02T12:00:00.000Z',
    accion: AccionAdministrador.MODIFICAR,
    descripcion: 'Se modificó el perfil del usuario.',
    entidad_afectada: { id_usuario_afectado: 'user-789' },
    id_usuario: 'actor-456',
  },
];

// ─── Admin User Data (from View) ───────────────────────────────────

export const mockAdminUserFromView = {
  id: 'admin-user-123',
  email: 'admin@example.com',
  nombres: 'Admin',
  apellidos: 'User',
  created_at: '2024-01-01T00:00:00.000Z',
  banned_until: null,
};

export const mockAdminUsersFromView = [
  mockAdminUserFromView,
  {
    id: 'admin-user-456',
    email: 'admin2@example.com',
    nombres: 'Second',
    apellidos: 'Admin',
    created_at: '2024-01-02T00:00:00.000Z',
    banned_until: null,
  },
];

// ─── UUID and ID generators ────────────────────────────────────────

export const testUserId = 'test-user-id-' + Math.random().toString(36).substr(2, 9);
export const testAdminId = 'test-admin-id-' + Math.random().toString(36).substr(2, 9);

export function generateTestUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
