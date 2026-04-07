import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  validateEmail,
  validatePasswordRule,
  validateRequiredString,
  isValidUUID,
  validateFieldRules,
  validateMaxLength,
  validateUsername,
  requiredRule,
  requiredPasswordRule,
  maxLengthRule,
  minLengthRule,
  emailRule,
  passwordRule,
  dniRule,
  usernameRule,
  ageRule,
  generoRule,
  matchRule,
  notBlankRule,
  placeIdRequiredRule,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  MAX_NOMBRE,
  MAX_USUARIO,
  MAX_DNI,
  MIN_DNI,
} from '@/lib/validations/rules';
import { Genero } from '@/lib/types/auth';

// ─── sanitizeText ──────────────────────────────────────────────────

describe('sanitizeText', () => {
  it('should return empty string for null', () => {
    expect(sanitizeText(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(sanitizeText(undefined)).toBe('');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(sanitizeText('  hello  ')).toBe('hello');
  });

  it('should collapse multiple internal spaces to single space', () => {
    expect(sanitizeText('hello    world')).toBe('hello world');
  });

  it('should handle mixed whitespace (tabs, newlines)', () => {
    expect(sanitizeText('  hello\t\nworld  ')).toBe('hello world');
  });

  it('should return empty string for whitespace-only input', () => {
    expect(sanitizeText('   ')).toBe('');
  });

  it('should preserve normal text', () => {
    expect(sanitizeText('hello world')).toBe('hello world');
  });
});

// ─── validateEmail ─────────────────────────────────────────────────

describe('validateEmail', () => {
  it.each([
    ['test@example.com', null],
    ['user.name@domain.co', null],
    ['user+tag@domain.org', null],
    ['name@subdomain.domain.com', null],
  ])('should return null for valid email: %s', (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });

  it.each([
    ['', 'El formato del correo electrónico no es válido.'],
    ['   ', 'El formato del correo electrónico no es válido.'],
    ['nodomain', 'El formato del correo electrónico no es válido.'],
    ['@nodomain.com', 'El formato del correo electrónico no es válido.'],
    ['user@', 'El formato del correo electrónico no es válido.'],
    ['user@.com', 'El formato del correo electrónico no es válido.'],
    ['user name@domain.com', 'El formato del correo electrónico no es válido.'],
  ])('should return error for invalid email: %s', (email, expected) => {
    expect(validateEmail(email)).toBe(expected);
  });
});

// ─── emailRule ─────────────────────────────────────────────────────

describe('emailRule', () => {
  const rule = emailRule();

  it('should return null for empty string (let requiredRule handle)', () => {
    expect(rule('')).toBeNull();
  });

  it('should return null for whitespace-only (let requiredRule handle)', () => {
    expect(rule('   ')).toBeNull();
  });

  it('should return null for valid email', () => {
    expect(rule('test@example.com')).toBeNull();
  });

  it('should return error for invalid format', () => {
    expect(rule('invalid')).toBe('El formato del correo electrónico no es válido.');
  });
});

// ─── validatePasswordRule ──────────────────────────────────────────

describe('validatePasswordRule', () => {
  it('should return null for valid password', () => {
    expect(validatePasswordRule('SecurePass123!')).toBeNull();
  });

  it('should return error for empty password', () => {
    expect(validatePasswordRule('')).toBe(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  });

  it('should return error for password too short', () => {
    expect(validatePasswordRule('Short1!')).toBe(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  });

  it('should return error for password missing lowercase', () => {
    expect(validatePasswordRule('SECUREPASS123!')).toBe('La contraseña debe contener al menos una letra minúscula.');
  });

  it('should return error for password missing uppercase', () => {
    expect(validatePasswordRule('securepass123!')).toBe('La contraseña debe contener al menos una letra mayúscula.');
  });

  it('should return error for password missing digit or special char', () => {
    expect(validatePasswordRule('SecurePassword')).toBe('La contraseña debe contener al menos un dígito o carácter especial.');
  });

  it('should return error for password with spaces', () => {
    expect(validatePasswordRule('Secure Pass123!')).toBe('La contraseña no puede contener espacios en blanco.');
  });

  it('should accept password at minimum length (12 chars)', () => {
    expect(validatePasswordRule('SecurePas12!')).toBeNull();
  });

  it('should return error for password exceeding max length', () => {
    const longPassword = 'A'.repeat(PASSWORD_MAX_LENGTH + 1);
    expect(validatePasswordRule(longPassword)).toBe(`La contraseña no puede exceder ${PASSWORD_MAX_LENGTH} caracteres.`);
  });
});

// ─── passwordRule ──────────────────────────────────────────────────

describe('passwordRule', () => {
  const rule = passwordRule();

  it('should return null for empty (let requiredRule handle)', () => {
    expect(rule('')).toBeNull();
  });

  it('should return null for null/undefined (let requiredRule handle)', () => {
    expect(rule(null)).toBeNull();
    expect(rule(undefined)).toBeNull();
  });

  it('should validate length constraints', () => {
    const shortPassword = 'Ab1!';
    expect(rule(shortPassword)).toBe(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`);
  });
});

// ─── validateRequiredString ────────────────────────────────────────

describe('validateRequiredString', () => {
  const label = 'Campo';

  it('should return null for valid non-empty string', () => {
    expect(validateRequiredString('hello', label)).toBeNull();
  });

  it('should return error for empty string', () => {
    expect(validateRequiredString('', label)).toBe(`${label} es obligatorio.`);
  });

  it('should return error for whitespace-only string', () => {
    expect(validateRequiredString('   ', label)).toBe(`${label} es obligatorio.`);
  });

  it('should return error for null', () => {
    expect(validateRequiredString(null, label)).toBe(`${label} es obligatorio.`);
  });

  it('should return error for undefined', () => {
    expect(validateRequiredString(undefined, label)).toBe(`${label} es obligatorio.`);
  });
});

// ─── requiredRule ──────────────────────────────────────────────────

describe('requiredRule', () => {
  const rule = requiredRule('Nombre');

  it('should return null for valid string', () => {
    expect(rule('John')).toBeNull();
  });

  it('should return error for empty string', () => {
    expect(rule('')).toBe('Nombre es obligatorio.');
  });

  it('should return error for whitespace-only', () => {
    expect(rule('   ')).toBe('Nombre es obligatorio.');
  });

  it('should return error for null', () => {
    expect(rule(null)).toBe('Nombre es obligatorio.');
  });

  it('should return error for undefined', () => {
    expect(rule(undefined)).toBe('Nombre es obligatorio.');
  });

  it('should use custom label in error message', () => {
    const customRule = requiredRule('Correo');
    expect(customRule('')).toBe('Correo es obligatorio.');
  });
});

// ─── requiredPasswordRule ──────────────────────────────────────────

describe('requiredPasswordRule', () => {
  const rule = requiredPasswordRule();

  it('should return null for valid password', () => {
    expect(rule('ValidPassword')).toBeNull();
  });

  it('should return error for falsy value', () => {
    expect(rule('')).toBe('La contraseña es obligatoria.');
    expect(rule(null)).toBe('La contraseña es obligatoria.');
    expect(rule(undefined)).toBe('La contraseña es obligatoria.');
  });

  it('should return specific error for whitespace-only', () => {
    expect(rule('   ')).toBe('La contraseña no puede contener espacios.');
  });
});

// ─── isValidUUID ───────────────────────────────────────────────────

describe('isValidUUID', () => {
  it.each([
    ['550e8400-e29b-41d4-a716-446655440000', true],
    ['123e4567-e89b-42d3-a456-426614174000', true],
    ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true],
  ])('should return true for valid UUID v4: %s', (uuid, expected) => {
    expect(isValidUUID(uuid)).toBe(expected);
  });

  it.each([
    ['not-a-uuid', false],
    ['', false],
    ['550e8400-e29b-11d4-a716-446655440000', false], // version 1 UUID
    ['550e8400-e29b-41d4-c716-446655440000', false], // invalid variant
    ['550e8400e29b41d4a716446655440000', false],    // no dashes
    ['550e8400-e29b-41d4-a716-44665544000', false],  // too short
    ['550e8400-e29b-41d4-a716-4466554400000', false],// too long
    ['GGGGGGGG-GGGG-4GGG-aGGG-GGGGGGGGGGGG', false], // invalid chars
  ])('should return false for invalid UUID: %s', (uuid, expected) => {
    expect(isValidUUID(uuid)).toBe(expected);
  });
});

// ─── validateFieldRules ────────────────────────────────────────────

describe('validateFieldRules', () => {
  it('should return null when all rules pass', () => {
    const rules = [requiredRule('Test'), maxLengthRule(10, 'Test')];
    expect(validateFieldRules('hello', rules)).toBeNull();
  });

  it('should return first error when a rule fails', () => {
    const rules = [requiredRule('Test'), maxLengthRule(10, 'Test')];
    expect(validateFieldRules('', rules)).toBe('Test es obligatorio.');
  });

  it('should return second error if first passes', () => {
    const rules = [requiredRule('Test'), maxLengthRule(5, 'Test')];
    expect(validateFieldRules('hello world', rules)).toBe('Test no puede exceder 5 caracteres.');
  });

  it('should handle empty rules array', () => {
    expect(validateFieldRules('anything', [])).toBeNull();
  });
});

// ─── maxLengthRule ─────────────────────────────────────────────────

describe('maxLengthRule', () => {
  const rule = maxLengthRule(10, 'Campo');

  it('should return null for string within limit', () => {
    expect(rule('hello')).toBeNull();
  });

  it('should return null for string at exact limit', () => {
    expect(rule('1234567890')).toBeNull();
  });

  it('should return error for string exceeding limit', () => {
    expect(rule('12345678901')).toBe('Campo no puede exceder 10 caracteres.');
  });

  it('should return null for non-string values', () => {
    expect(rule(123)).toBeNull();
    expect(rule(null)).toBeNull();
  });
});

// ─── minLengthRule ─────────────────────────────────────────────────

describe('minLengthRule', () => {
  const rule = minLengthRule(5, 'Campo');

  it('should return null for string meeting minimum', () => {
    expect(rule('hello')).toBeNull();
  });

  it('should return null for string exceeding minimum', () => {
    expect(rule('hello world')).toBeNull();
  });

  it('should return error for string below minimum', () => {
    expect(rule('hi')).toBe('Campo debe tener al menos 5 caracteres.');
  });

  it('should return null for non-string values', () => {
    expect(rule(123)).toBeNull();
    expect(rule(null)).toBeNull();
  });
});

// ─── validateMaxLength ─────────────────────────────────────────────

describe('validateMaxLength', () => {
  it('should return null for valid length', () => {
    expect(validateMaxLength('hello', 10, 'Campo')).toBeNull();
  });

  it('should return error for exceeded length', () => {
    expect(validateMaxLength('hello world', 5, 'Campo')).toBe('Campo no puede exceder 5 caracteres.');
  });
});

// ─── dniRule ───────────────────────────────────────────────────────

describe('dniRule', () => {
  const rule = dniRule();

  it('should return null for valid DNI', () => {
    expect(rule('12345678A')).toBeNull();
  });

  it('should return null for valid DNI at min length', () => {
    expect(rule('12345')).toBeNull();
  });

  it('should return null for valid DNI at max length', () => {
    expect(rule('12345678901234567890')).toBeNull();
  });

  it('should return null for empty string (let requiredRule handle)', () => {
    expect(rule('')).toBeNull();
  });

  it('should return error for whitespace-only', () => {
    expect(rule('   ')).toBe('El documento no puede contener solo espacios.');
  });

  it('should return error for DNI too short', () => {
    expect(rule('1234')).toBe(`El documento debe tener entre ${MIN_DNI} y ${MAX_DNI} caracteres alfanuméricos.`);
  });

  it('should return error for DNI too long', () => {
    expect(rule('123456789012345678901')).toBe(`El documento debe tener entre ${MIN_DNI} y ${MAX_DNI} caracteres alfanuméricos.`);
  });

  it('should return error for DNI with invalid characters', () => {
    expect(rule('12345-678')).toBe(`El documento debe tener entre ${MIN_DNI} y ${MAX_DNI} caracteres alfanuméricos.`);
  });
});

// ─── usernameRule ──────────────────────────────────────────────────

describe('usernameRule', () => {
  const rule = usernameRule();

  it.each([
    ['juancarlos', null],
    ['juan.carlos', null],
    ['juan-carlos', null],
    ['JuanCarlos123', null],
  ])('should return null for valid username: %s', (username, expected) => {
    expect(rule(username)).toBe(expected);
  });

  it('should return null for empty string (let requiredRule handle)', () => {
    expect(rule('')).toBeNull();
  });

  it('should return error for whitespace-only', () => {
    expect(rule('   ')).toBe('El nombre de usuario no puede contener solo espacios.');
  });

  it('should return error for invalid characters', () => {
    expect(rule('juan_carlos')).toBe('El nombre de usuario solo puede contener letras, números, guiones (-) y puntos (.).');
    expect(rule('juan carlos')).toBe('El nombre de usuario solo puede contener letras, números, guiones (-) y puntos (.).');
    expect(rule('juan@carlos')).toBe('El nombre de usuario solo puede contener letras, números, guiones (-) y puntos (.).');
  });

  it('should return error for username exceeding max length', () => {
    const longUsername = 'a'.repeat(MAX_USUARIO + 1);
    expect(rule(longUsername)).toBe(`El nombre de usuario no puede exceder ${MAX_USUARIO} caracteres.`);
  });
});

// ─── validateUsername ──────────────────────────────────────────────

describe('validateUsername', () => {
  it('should return null for valid username', () => {
    expect(validateUsername('juancarlos')).toBeNull();
  });

  it('should return error for invalid username', () => {
    expect(validateUsername('juan_carlos')).toBe('El nombre de usuario solo puede contener letras, números, guiones (-) y puntos (.).');
  });
});

// ─── ageRule ───────────────────────────────────────────────────────

describe('ageRule', () => {
  const rule = ageRule(18, 80);

  it('should return null for empty (let requiredRule handle)', () => {
    expect(rule('')).toBeNull();
    expect(rule('   ')).toBeNull();
  });

  it('should return error for invalid date', () => {
    expect(rule('not-a-date')).toBe('La fecha de nacimiento no es válida.');
  });

  it('should return error for future date', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    expect(rule(futureDate.toISOString().split('T')[0])).toBe('No puedes haber nacido en el futuro.');
  });

  it('should return error for age below minimum', () => {
    const today = new Date();
    const tooYoung = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
    expect(rule(tooYoung.toISOString().split('T')[0])).toBe('Debes tener al menos 18 años.');
  });

  it('should return error for age above maximum', () => {
    const today = new Date();
    const tooOld = new Date(today.getFullYear() - 81, today.getMonth(), today.getDate());
    expect(rule(tooOld.toISOString().split('T')[0])).toBe('La edad máxima permitida es 80 años.');
  });

  it('should return null for valid age (exactly 18)', () => {
    const today = new Date();
    const exactly18 = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate() - 1);
    expect(rule(exactly18.toISOString().split('T')[0])).toBeNull();
  });

  it('should return null for valid age (exactly 80)', () => {
    const today = new Date();
    const exactly80 = new Date(today.getFullYear() - 80, today.getMonth(), today.getDate());
    expect(rule(exactly80.toISOString().split('T')[0])).toBeNull();
  });

  it('should return null for age in valid range (30)', () => {
    const today = new Date();
    const age30 = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    expect(rule(age30.toISOString().split('T')[0])).toBeNull();
  });
});

// ─── generoRule ────────────────────────────────────────────────────

describe('generoRule', () => {
  const rule = generoRule();

  it.each([
    [Genero.Masculino, null],
    [Genero.Femenino, null],
    [Genero.Otro, null],
  ])('should return null for valid genero: %s', (genero, expected) => {
    expect(rule(genero)).toBe(expected);
  });

  it('should return null for null/undefined (let requiredRule handle)', () => {
    expect(rule(null)).toBeNull();
    expect(rule(undefined)).toBeNull();
  });

  it('should return error for empty string (non-null but invalid)', () => {
    expect(rule('')).toBe('El género seleccionado no es válido.');
  });

  it('should return error for whitespace-only', () => {
    expect(rule('   ')).toBe('El género seleccionado no es válido.');
  });

  it('should return error for invalid genero value', () => {
    expect(rule('invalid')).toBe('El género seleccionado no es válido.');
    expect(rule('MASCULINO')).toBe('El género seleccionado no es válido.');
  });
});

// ─── matchRule ─────────────────────────────────────────────────────

describe('matchRule', () => {
  it('should return null when values match', () => {
    const rule = matchRule(() => 'password123', 'Las contraseñas no coinciden.');
    expect(rule('password123')).toBeNull();
  });

  it('should return error when values do not match', () => {
    const rule = matchRule(() => 'password123', 'Las contraseñas no coinciden.');
    expect(rule('different')).toBe('Las contraseñas no coinciden.');
  });

  it('should return null when either value is empty', () => {
    const rule = matchRule(() => 'password123', 'Las contraseñas no coinciden.');
    expect(rule('')).toBeNull();

    const rule2 = matchRule(() => '', 'Las contraseñas no coinciden.');
    expect(rule2('password123')).toBeNull();
  });
});

// ─── notBlankRule ──────────────────────────────────────────────────

describe('notBlankRule', () => {
  const rule = notBlankRule('campo');

  it('should return null for valid string', () => {
    expect(rule('hello')).toBeNull();
  });

  it('should return null for empty string (let requiredRule handle)', () => {
    expect(rule('')).toBeNull();
  });

  it('should return error for whitespace-only string', () => {
    expect(rule('   ')).toBe('El campo campo no puede estar vacío.');
  });

  it('should return null for non-string values', () => {
    expect(rule(null)).toBeNull();
    expect(rule(123)).toBeNull();
  });
});

// ─── placeIdRequiredRule ───────────────────────────────────────────

describe('placeIdRequiredRule', () => {
  const rule = placeIdRequiredRule();

  it('should return null for valid place_id', () => {
    expect(rule('ChIJgTwKgJcpQg0RaSKMYcHeNsQ')).toBeNull();
  });

  it('should return error for empty string', () => {
    expect(rule('')).toBe('Por favor selecciona una dirección válida de las sugerencias.');
  });

  it('should return error for whitespace-only', () => {
    expect(rule('   ')).toBe('Por favor selecciona una dirección válida de las sugerencias.');
  });

  it('should return error for null/undefined', () => {
    expect(rule(null)).toBe('Por favor selecciona una dirección válida de las sugerencias.');
    expect(rule(undefined)).toBe('Por favor selecciona una dirección válida de las sugerencias.');
  });
});

// ─── Constants exports ─────────────────────────────────────────────

describe('Exported constants', () => {
  it('should export PASSWORD_MIN_LENGTH as 12', () => {
    expect(PASSWORD_MIN_LENGTH).toBe(12);
  });

  it('should export PASSWORD_MAX_LENGTH as 128', () => {
    expect(PASSWORD_MAX_LENGTH).toBe(128);
  });

  it('should export MAX_NOMBRE as 100', () => {
    expect(MAX_NOMBRE).toBe(100);
  });

  it('should export MAX_USUARIO as 30', () => {
    expect(MAX_USUARIO).toBe(30);
  });

  it('should export MAX_DNI as 20', () => {
    expect(MAX_DNI).toBe(20);
  });

  it('should export MIN_DNI as 5', () => {
    expect(MIN_DNI).toBe(5);
  });
});
