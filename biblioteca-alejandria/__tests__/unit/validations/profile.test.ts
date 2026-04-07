import { describe, it, expect } from 'vitest';
import {
  validateFullProfile,
  validateProfileUpdate,
} from '@/lib/validations/profile';
import { Genero } from '@/lib/types/auth';
import {
  validFullProfilePayload,
  validProfileUpdatePayload,
} from '@/__tests__/mocks/fixtures';
import {
  MAX_NOMBRE,
  MAX_APELLIDO,
  MAX_USUARIO,
  MAX_DIRECCION_DETALLE,
} from '@/lib/validations/rules';

// ─── validateFullProfile ───────────────────────────────────────────

describe('validateFullProfile', () => {
  describe('with valid data', () => {
    it('should return no errors for valid full profile', () => {
      const result = validateFullProfile(validFullProfilePayload);
      expect(result.errors).toEqual({});
    });

    it('should sanitize text fields', () => {
      const payload = {
        ...validFullProfilePayload,
        nombres: '  Juan   Carlos  ',
        apellidos: '  García   López  ',
        direccion: '  Calle   Principal  ',
      };
      const result = validateFullProfile(payload);
      expect(result.sanitized.nombres).toBe('Juan Carlos');
      expect(result.sanitized.apellidos).toBe('García López');
      expect(result.sanitized.direccion).toBe('Calle Principal');
    });

    it('should normalize optional direccion_detalle to null when empty', () => {
      const payload = {
        ...validFullProfilePayload,
        direccion_detalle: '   ',
      };
      const result = validateFullProfile(payload);
      expect(result.sanitized.direccion_detalle).toBeNull();
    });

    it('should keep valid direccion_detalle sanitized', () => {
      const payload = {
        ...validFullProfilePayload,
        direccion_detalle: '  Piso   3  ',
      };
      const result = validateFullProfile(payload);
      expect(result.sanitized.direccion_detalle).toBe('Piso 3');
    });
  });

  describe('DNI validation', () => {
    it('should return error for empty DNI', () => {
      const payload = { ...validFullProfilePayload, dni: '' };
      const result = validateFullProfile(payload);
      expect(result.errors.dni).toBe('DNI es obligatorio.');
    });

    it('should return error for DNI too short', () => {
      const payload = { ...validFullProfilePayload, dni: '123' };
      const result = validateFullProfile(payload);
      expect(result.errors.dni).toBe('El documento debe tener entre 5 y 20 caracteres alfanuméricos.');
    });

    it('should return error for DNI with invalid characters', () => {
      const payload = { ...validFullProfilePayload, dni: '12345-678A' };
      const result = validateFullProfile(payload);
      expect(result.errors.dni).toBe('El documento debe tener entre 5 y 20 caracteres alfanuméricos.');
    });
  });

  describe('nombres validation', () => {
    it('should return error for empty nombres', () => {
      const payload = { ...validFullProfilePayload, nombres: '' };
      const result = validateFullProfile(payload);
      expect(result.errors.nombres).toBe('Nombres es obligatorio.');
    });

    it('should return error for whitespace-only nombres', () => {
      const payload = { ...validFullProfilePayload, nombres: '   ' };
      const result = validateFullProfile(payload);
      expect(result.errors.nombres).toBe('Nombres es obligatorio.');
    });

    it('should return error for nombres exceeding max length', () => {
      const payload = { ...validFullProfilePayload, nombres: 'A'.repeat(MAX_NOMBRE + 1) };
      const result = validateFullProfile(payload);
      expect(result.errors.nombres).toBe(`Nombres no puede exceder ${MAX_NOMBRE} caracteres.`);
    });
  });

  describe('apellidos validation', () => {
    it('should return error for empty apellidos', () => {
      const payload = { ...validFullProfilePayload, apellidos: '' };
      const result = validateFullProfile(payload);
      expect(result.errors.apellidos).toBe('Apellidos es obligatorio.');
    });

    it('should return error for apellidos exceeding max length', () => {
      const payload = { ...validFullProfilePayload, apellidos: 'A'.repeat(MAX_APELLIDO + 1) };
      const result = validateFullProfile(payload);
      expect(result.errors.apellidos).toBe(`Apellidos no puede exceder ${MAX_APELLIDO} caracteres.`);
    });
  });

  describe('fecha_nacimiento validation', () => {
    it('should return error for empty fecha_nacimiento', () => {
      const payload = { ...validFullProfilePayload, fecha_nacimiento: '' };
      const result = validateFullProfile(payload);
      expect(result.errors.fecha_nacimiento).toBe('Fecha de nacimiento es obligatorio.');
    });

    it('should return error for future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const payload = { ...validFullProfilePayload, fecha_nacimiento: futureDate.toISOString().split('T')[0] };
      const result = validateFullProfile(payload);
      expect(result.errors.fecha_nacimiento).toBe('No puedes haber nacido en el futuro.');
    });

    it('should return error for age below 18', () => {
      const today = new Date();
      const tooYoung = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
      const payload = { ...validFullProfilePayload, fecha_nacimiento: tooYoung.toISOString().split('T')[0] };
      const result = validateFullProfile(payload);
      expect(result.errors.fecha_nacimiento).toBe('Debes tener al menos 18 años.');
    });

    it('should return error for age above 80', () => {
      const today = new Date();
      const tooOld = new Date(today.getFullYear() - 81, today.getMonth(), today.getDate());
      const payload = { ...validFullProfilePayload, fecha_nacimiento: tooOld.toISOString().split('T')[0] };
      const result = validateFullProfile(payload);
      expect(result.errors.fecha_nacimiento).toBe('La edad máxima permitida es 80 años.');
    });
  });

  describe('lugar_nacimiento validation', () => {
    it('should return error for empty lugar_nacimiento', () => {
      const payload = { ...validFullProfilePayload, lugar_nacimiento: '' };
      const result = validateFullProfile(payload);
      expect(result.errors.lugar_nacimiento).toBe('Lugar de nacimiento es obligatorio.');
    });
  });

  describe('genero validation', () => {
    it('should return error for empty genero', () => {
      const payload = { ...validFullProfilePayload, genero: '' as Genero };
      const result = validateFullProfile(payload);
      expect(result.errors.genero).toBe('Género es obligatorio.');
    });

    it('should return error for invalid genero value', () => {
      const payload = { ...validFullProfilePayload, genero: 'invalid' as Genero };
      const result = validateFullProfile(payload);
      expect(result.errors.genero).toBe('El género seleccionado no es válido.');
    });

    it.each([
      [Genero.Masculino],
      [Genero.Femenino],
      [Genero.Otro],
    ])('should accept valid genero: %s', (genero) => {
      const payload = { ...validFullProfilePayload, genero };
      const result = validateFullProfile(payload);
      expect(result.errors.genero).toBeUndefined();
    });
  });

  describe('usuario validation', () => {
    it('should return error for empty usuario', () => {
      const payload = { ...validFullProfilePayload, usuario: '' };
      const result = validateFullProfile(payload);
      expect(result.errors.usuario).toBe('Nombre de usuario es obligatorio.');
    });

    it('should return error for usuario with invalid characters', () => {
      const payload = { ...validFullProfilePayload, usuario: 'user_name' };
      const result = validateFullProfile(payload);
      expect(result.errors.usuario).toBe('El nombre de usuario solo puede contener letras, números, guiones (-) y puntos (.).');
    });

    it('should return error for usuario exceeding max length', () => {
      const payload = { ...validFullProfilePayload, usuario: 'a'.repeat(MAX_USUARIO + 1) };
      const result = validateFullProfile(payload);
      expect(result.errors.usuario).toBe(`El nombre de usuario no puede exceder ${MAX_USUARIO} caracteres.`);
    });

    it('should accept valid usuario with dots and dashes', () => {
      const payload = { ...validFullProfilePayload, usuario: 'user.name-123' };
      const result = validateFullProfile(payload);
      expect(result.errors.usuario).toBeUndefined();
    });
  });

  describe('direccion validation', () => {
    it('should return error for empty direccion', () => {
      const payload = { ...validFullProfilePayload, direccion: '' };
      const result = validateFullProfile(payload);
      expect(result.errors.direccion).toBe('Dirección es obligatorio.');
    });
  });

  describe('direccion_place_id validation', () => {
    it('should return error when direccion_place_id is empty with valid direccion', () => {
      const payload = { ...validFullProfilePayload, direccion_place_id: '' };
      const result = validateFullProfile(payload);
      expect(result.errors.direccion).toBe('Por favor selecciona una dirección válida de las sugerencias.');
    });

    it('should return error when direccion_place_id is whitespace-only', () => {
      const payload = { ...validFullProfilePayload, direccion_place_id: '   ' };
      const result = validateFullProfile(payload);
      expect(result.errors.direccion).toBe('Por favor selecciona una dirección válida de las sugerencias.');
    });
  });

  describe('direccion_detalle validation', () => {
    it('should accept empty direccion_detalle (optional)', () => {
      const payload = { ...validFullProfilePayload, direccion_detalle: '' };
      const result = validateFullProfile(payload);
      expect(result.errors.direccion_detalle).toBeUndefined();
    });

    it('should accept null/undefined direccion_detalle (optional)', () => {
      const payload = { ...validFullProfilePayload, direccion_detalle: undefined };
      const result = validateFullProfile(payload);
      expect(result.errors.direccion_detalle).toBeUndefined();
    });

    it('should return error for direccion_detalle exceeding max length', () => {
      const payload = { ...validFullProfilePayload, direccion_detalle: 'A'.repeat(MAX_DIRECCION_DETALLE + 1) };
      const result = validateFullProfile(payload);
      expect(result.errors.direccion_detalle).toBe(`Detalle de la dirección no puede exceder ${MAX_DIRECCION_DETALLE} caracteres.`);
    });
  });

  describe('multiple errors', () => {
    it('should return multiple errors when multiple fields are invalid', () => {
      const payload = {
        ...validFullProfilePayload,
        dni: '',
        nombres: '',
        apellidos: '',
        usuario: '',
      };
      const result = validateFullProfile(payload);
      expect(Object.keys(result.errors)).toHaveLength(4);
      expect(result.errors.dni).toBeDefined();
      expect(result.errors.nombres).toBeDefined();
      expect(result.errors.apellidos).toBeDefined();
      expect(result.errors.usuario).toBeDefined();
    });
  });
});

// ─── validateProfileUpdate ─────────────────────────────────────────

describe('validateProfileUpdate', () => {
  describe('with valid data', () => {
    it('should return no errors for valid update payload', () => {
      const result = validateProfileUpdate(validProfileUpdatePayload);
      expect(result.errors).toEqual({});
    });

    it('should sanitize text fields', () => {
      const payload = {
        ...validProfileUpdatePayload,
        nombres: '  Updated   Name  ',
        apellidos: '  Updated   Surname  ',
      };
      const result = validateProfileUpdate(payload);
      expect(result.sanitized.nombres).toBe('Updated Name');
      expect(result.sanitized.apellidos).toBe('Updated Surname');
    });
  });

  describe('nombres validation', () => {
    it('should return error for empty nombres', () => {
      const payload = { ...validProfileUpdatePayload, nombres: '' };
      const result = validateProfileUpdate(payload);
      expect(result.errors.nombres).toBe('Nombres es obligatorio.');
    });

    it('should return error for nombres exceeding max length', () => {
      const payload = { ...validProfileUpdatePayload, nombres: 'A'.repeat(MAX_NOMBRE + 1) };
      const result = validateProfileUpdate(payload);
      expect(result.errors.nombres).toBe(`Nombres no puede exceder ${MAX_NOMBRE} caracteres.`);
    });
  });

  describe('apellidos validation', () => {
    it('should return error for empty apellidos', () => {
      const payload = { ...validProfileUpdatePayload, apellidos: '' };
      const result = validateProfileUpdate(payload);
      expect(result.errors.apellidos).toBe('Apellidos es obligatorio.');
    });
  });

  describe('genero validation', () => {
    it('should return error for empty genero', () => {
      const payload = { ...validProfileUpdatePayload, genero: '' as Genero };
      const result = validateProfileUpdate(payload);
      expect(result.errors.genero).toBe('Género es obligatorio.');
    });

    it('should return error for invalid genero', () => {
      const payload = { ...validProfileUpdatePayload, genero: 'INVALID' as Genero };
      const result = validateProfileUpdate(payload);
      expect(result.errors.genero).toBe('El género seleccionado no es válido.');
    });
  });

  describe('usuario validation', () => {
    it('should return error for empty usuario', () => {
      const payload = { ...validProfileUpdatePayload, usuario: '' };
      const result = validateProfileUpdate(payload);
      expect(result.errors.usuario).toBe('Nombre de usuario es obligatorio.');
    });

    it('should return error for invalid characters in usuario', () => {
      const payload = { ...validProfileUpdatePayload, usuario: 'user@name' };
      const result = validateProfileUpdate(payload);
      expect(result.errors.usuario).toBe('El nombre de usuario solo puede contener letras, números, guiones (-) y puntos (.).');
    });
  });

  describe('direccion validation', () => {
    it('should return error for empty direccion', () => {
      const payload = { ...validProfileUpdatePayload, direccion: '' };
      const result = validateProfileUpdate(payload);
      expect(result.errors.direccion).toBe('Dirección es obligatorio.');
    });
  });

  describe('direccion_place_id validation', () => {
    it('should return error when direccion_place_id is empty with valid direccion', () => {
      const payload = { ...validProfileUpdatePayload, direccion_place_id: '' };
      const result = validateProfileUpdate(payload);
      expect(result.errors.direccion).toBe('Por favor selecciona una dirección válida de las sugerencias.');
    });
  });

  describe('direccion_detalle validation', () => {
    it('should accept empty direccion_detalle (optional)', () => {
      const payload = { ...validProfileUpdatePayload, direccion_detalle: '' };
      const result = validateProfileUpdate(payload);
      expect(result.errors.direccion_detalle).toBeUndefined();
    });

    it('should return error for direccion_detalle exceeding max length', () => {
      const payload = { ...validProfileUpdatePayload, direccion_detalle: 'X'.repeat(MAX_DIRECCION_DETALLE + 1) };
      const result = validateProfileUpdate(payload);
      expect(result.errors.direccion_detalle).toBe(`Detalle de la dirección no puede exceder ${MAX_DIRECCION_DETALLE} caracteres.`);
    });
  });

  describe('excludes immutable fields', () => {
    it('should not validate dni (immutable field)', () => {
      // ProfileUpdatePayload doesn't include dni
      const result = validateProfileUpdate(validProfileUpdatePayload);
      expect(result.errors.dni).toBeUndefined();
    });

    it('should not validate fecha_nacimiento (immutable field)', () => {
      // ProfileUpdatePayload doesn't include fecha_nacimiento
      const result = validateProfileUpdate(validProfileUpdatePayload);
      expect(result.errors.fecha_nacimiento).toBeUndefined();
    });

    it('should not validate lugar_nacimiento (immutable field)', () => {
      // ProfileUpdatePayload doesn't include lugar_nacimiento
      const result = validateProfileUpdate(validProfileUpdatePayload);
      expect(result.errors.lugar_nacimiento).toBeUndefined();
    });
  });

  describe('multiple errors', () => {
    it('should return multiple errors when multiple fields are invalid', () => {
      const payload = {
        ...validProfileUpdatePayload,
        nombres: '',
        apellidos: '',
        usuario: '',
        direccion: '',
      };
      const result = validateProfileUpdate(payload);
      expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3);
      expect(result.errors.nombres).toBeDefined();
      expect(result.errors.apellidos).toBeDefined();
      expect(result.errors.usuario).toBeDefined();
    });
  });
});
