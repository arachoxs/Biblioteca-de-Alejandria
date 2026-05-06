import {
  requiredRule,
  maxLengthRule,
  minLengthRule,
  validateFieldRules,
  MAX_COPIAS_POR_INSERCION,
} from "./rules";

export interface LibroValidationPayload {
  titulo: string;
  isbn: string;
  idioma: string;
  sinopsis: string;
  paginas: string;
  precio: string;
  estado: string;
  id_autor: string;
  id_categoria: string;
  fecha_publicacion: string;
  editorial: string;
}

const ISBN_REGEX = /^(?:\d{9}[\dX]|\d{13}|\d{1,5}-\d{1,7}-\d{1,7}-[\dX])$/;

/**
 * Valida datos de un libro (cliente/servidor).
 * Sanitización se realiza fuera usando utilidades comunes.
 */
export function validateLibro(
  payload: LibroValidationPayload,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const tituloErr = validateFieldRules(payload.titulo, [
    requiredRule("Título"),
    maxLengthRule(300, "Título"),
  ]);
  if (tituloErr) errors.titulo = tituloErr;

  const isbnErr = validateFieldRules(payload.isbn, [
    requiredRule("ISBN"),
    maxLengthRule(20, "ISBN"),
  ]);
  if (isbnErr) {
    errors.isbn = isbnErr;
  } else if (!ISBN_REGEX.test(payload.isbn.trim())) {
    errors.isbn = "Formato de ISBN no válido (10 o 13 dígitos).";
  }

  const idiomaErr = validateFieldRules(payload.idioma, [
    requiredRule("Idioma"),
    maxLengthRule(50, "Idioma"),
  ]);
  if (idiomaErr) errors.idioma = idiomaErr;

  const sinopsisErr = validateFieldRules(payload.sinopsis, [
    requiredRule("Sinopsis"),
    minLengthRule(10, "Sinopsis"),
    maxLengthRule(2000, "Sinopsis"),
  ]);
  if (sinopsisErr) errors.sinopsis = sinopsisErr;

  // Páginas
  const paginasReq = validateFieldRules(payload.paginas, [
    requiredRule("Páginas"),
  ]);
  if (paginasReq) {
    errors.paginas = paginasReq;
  } else {
    const parsed = Number(payload.paginas);
    if (!Number.isInteger(parsed) || parsed < 1) {
      errors.paginas = "Las páginas deben ser un número entero mayor a 0.";
    } else if (parsed > 50000) {
      errors.paginas = "El número de páginas no puede exceder 50,000.";
    }
  }

  // Precio
  const precioReq = validateFieldRules(payload.precio, [
    requiredRule("Precio"),
  ]);
  if (precioReq) {
    errors.precio = precioReq;
  } else {
    const parsed = Number(payload.precio);
    if (isNaN(parsed) || parsed < 0) {
      errors.precio = "El precio debe ser un número mayor o igual a 0.";
    }
  }

  // Fecha publicación
  const fechaReq = validateFieldRules(payload.fecha_publicacion, [
    requiredRule("Fecha de publicación"),
  ]);
  if (fechaReq) {
    errors.fecha_publicacion = fechaReq;
  } else {
    const date = new Date(payload.fecha_publicacion);
    if (isNaN(date.getTime())) {
      errors.fecha_publicacion = "Formato de fecha inválido.";
    } else if (date > new Date()) {
      errors.fecha_publicacion = "La fecha no puede estar en el futuro.";
    }
  }

  // Estado
  const estadoErr = validateFieldRules(payload.estado, [
    requiredRule("Estado"),
  ]);
  if (estadoErr) {
    errors.estado = estadoErr;
  } else if (payload.estado !== "nuevo" && payload.estado !== "usado") {
    errors.estado = "El estado debe ser 'nuevo' o 'usado'.";
  }

  // Relaciones
  const autorErr = validateFieldRules(payload.id_autor, [
    requiredRule("Autor"),
  ]);
  if (autorErr) errors.id_autor = autorErr;

  const catErr = validateFieldRules(payload.id_categoria, [
    requiredRule("Categoría"),
  ]);
  if (catErr) errors.id_categoria = catErr;

  // Editorial
  const editorialErr = validateFieldRules(payload.editorial, [
    requiredRule("Editorial"),
    maxLengthRule(200, "Editorial"),
  ]);
  if (editorialErr) errors.editorial = editorialErr;

  return errors;
}

/**
 * Valida la cantidad de copias del inventario (cliente/servidor).
 */
export function validateInventarioCantidad(cantidad: string): string | null {
  if (!cantidad.trim()) {
    return "La cantidad es obligatoria.";
  }
  if (!/^\d+$/.test(cantidad)) {
    return "La cantidad debe ser un número entero mayor a 0.";
  }
  const parsed = Number(cantidad);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return "La cantidad debe ser un número entero mayor a 0.";
  }
  if (parsed > MAX_COPIAS_POR_INSERCION) {
    return `Máximo ${MAX_COPIAS_POR_INSERCION} copias por registro.`;
  }
  return null;
}
