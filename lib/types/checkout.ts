export interface TiendaConDireccion {
  id: string
  nombre: string
  direccion_formateada: string
  place_id: string
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
