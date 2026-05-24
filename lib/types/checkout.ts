export interface TiendaConDireccion {
  id: string
  nombre: string
  direccion_formateada: string
  place_id: string
}

export interface SwappedBook {
  libroId: string
  titulo: string
  oldCopiaId: string
  newCopiaId: string
}

export interface TrasladoDetalle {
  libroIds: string[]
  titulos: string[]
  diasLaborales: number
  costo: number
}

export interface OpcionEnvio {
  tipo: "domicilio" | "recogida" | "traslado"
  tiendaId: string | null
  tiendaNombre: string | null
  tiendaPlaceId: string | null
  tiendaDireccion: string | null
  costo: number
  mensaje: string
  requiereTraslado: boolean
  swappedBooks?: SwappedBook[]
  trasladoDetalle?: TrasladoDetalle
}

export interface EnvioState {
  opcionSeleccionada: OpcionEnvio | null
}

export interface ResultadoEnvio {
  tiendaMasCercana: (TiendaConDireccion & { distanciaKm: number; duracionMin: number }) | null
  opciones: OpcionEnvio[]
}

export interface DisponibilidadLibroTienda {
  libroId: string
  tiendaId: string
  stockDisponible: number
}
