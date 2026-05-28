export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      auditoria: {
        Row: {
          accion: Database["public"]["Enums"]["accion_administrador"]
          descripcion: string
          entidad_afectada: Json
          fecha: string
          id: number
          id_usuario: string | null
        }
        Insert: {
          accion: Database["public"]["Enums"]["accion_administrador"]
          descripcion: string
          entidad_afectada: Json
          fecha: string
          id?: number
          id_usuario?: string | null
        }
        Update: {
          accion?: Database["public"]["Enums"]["accion_administrador"]
          descripcion?: string
          entidad_afectada?: Json
          fecha?: string
          id?: number
          id_usuario?: string | null
        }
        Relationships: []
      }
      autor: {
        Row: {
          deleted_at: string | null
          fecha_nacimiento: string | null
          id: number
          nacionalidad: string | null
          nombre: string
        }
        Insert: {
          deleted_at?: string | null
          fecha_nacimiento?: string | null
          id?: number
          nacionalidad?: string | null
          nombre: string
        }
        Update: {
          deleted_at?: string | null
          fecha_nacimiento?: string | null
          id?: number
          nacionalidad?: string | null
          nombre?: string
        }
        Relationships: []
      }
      categoria: {
        Row: {
          deleted_at: string | null
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          deleted_at?: string | null
          descripcion?: string | null
          id?: number
          nombre: string
        }
        Update: {
          deleted_at?: string | null
          descripcion?: string | null
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      compra: {
        Row: {
          fecha: string
          id: string
          id_promocion: number | null
          id_usuario: string
          subtotal: number
          total: number
        }
        Insert: {
          fecha: string
          id?: string
          id_promocion?: number | null
          id_usuario: string
          subtotal: number
          total: number
        }
        Update: {
          fecha?: string
          id?: string
          id_promocion?: number | null
          id_usuario?: string
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "Compra_id_promocion_fkey"
            columns: ["id_promocion"]
            isOneToOne: false
            referencedRelation: "promocion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      copia: {
        Row: {
          codigo_seq: string | null
          deleted_at: string | null
          estado: Database["public"]["Enums"]["estado_copia"]
          id: string
          id_libro: string
          id_tienda: string
        }
        Insert: {
          codigo_seq?: string | null
          deleted_at?: string | null
          estado: Database["public"]["Enums"]["estado_copia"]
          id?: string
          id_libro: string
          id_tienda: string
        }
        Update: {
          codigo_seq?: string | null
          deleted_at?: string | null
          estado?: Database["public"]["Enums"]["estado_copia"]
          id?: string
          id_libro?: string
          id_tienda?: string
        }
        Relationships: [
          {
            foreignKeyName: "copia_id_libro_fkey"
            columns: ["id_libro"]
            isOneToOne: false
            referencedRelation: "libro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copia_id_libro_fkey"
            columns: ["id_libro"]
            isOneToOne: false
            referencedRelation: "vista_inventario"
            referencedColumns: ["libro_id"]
          },
          {
            foreignKeyName: "copia_id_tienda_fkey"
            columns: ["id_tienda"]
            isOneToOne: false
            referencedRelation: "tienda"
            referencedColumns: ["id"]
          },
        ]
      }
      devolucion: {
        Row: {
          deleted_at: string | null
          estado: Database["public"]["Enums"]["estado_devolucion"]
          fecha: string
          id: number
          id_usuario: string
        }
        Insert: {
          deleted_at?: string | null
          estado: Database["public"]["Enums"]["estado_devolucion"]
          fecha: string
          id?: number
          id_usuario: string
        }
        Update: {
          deleted_at?: string | null
          estado?: Database["public"]["Enums"]["estado_devolucion"]
          fecha?: string
          id?: number
          id_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "Devolucion_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      direccion: {
        Row: {
          deleted_at: string | null
          detalle_direccion: string | null
          direccion_formateada: string
          id: number
          place_id: string
        }
        Insert: {
          deleted_at?: string | null
          detalle_direccion?: string | null
          direccion_formateada: string
          id?: number
          place_id: string
        }
        Update: {
          deleted_at?: string | null
          detalle_direccion?: string | null
          direccion_formateada?: string
          id?: number
          place_id?: string
        }
        Relationships: []
      }
      entrega: {
        Row: {
          costo: number
          estado: Database["public"]["Enums"]["estado_entrega"]
          fecha_entrega_estimada: string
          fecha_entregado: string | null
          id: string
          id_compra: string
          id_direccion_destino: number
          tipo: Database["public"]["Enums"]["tipo_entrega"]
        }
        Insert: {
          costo: number
          estado: Database["public"]["Enums"]["estado_entrega"]
          fecha_entrega_estimada: string
          fecha_entregado?: string | null
          id?: string
          id_compra: string
          id_direccion_destino: number
          tipo: Database["public"]["Enums"]["tipo_entrega"]
        }
        Update: {
          costo?: number
          estado?: Database["public"]["Enums"]["estado_entrega"]
          fecha_entrega_estimada?: string
          fecha_entregado?: string | null
          id?: string
          id_compra?: string
          id_direccion_destino?: number
          tipo?: Database["public"]["Enums"]["tipo_entrega"]
        }
        Relationships: [
          {
            foreignKeyName: "Entrega_id_compra_fkey"
            columns: ["id_compra"]
            isOneToOne: false
            referencedRelation: "compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Entrega_id_direccion_destino_fkey"
            columns: ["id_direccion_destino"]
            isOneToOne: false
            referencedRelation: "direccion"
            referencedColumns: ["id"]
          },
        ]
      }
      evento_log: {
        Row: {
          id: number
          id_usuario: string
          tipo_entidad: string
          tipo_evento: string
        }
        Insert: {
          id?: number
          id_usuario: string
          tipo_entidad: string
          tipo_evento: string
        }
        Update: {
          id?: number
          id_usuario?: string
          tipo_entidad?: string
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "EventoLog_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      hilo_mensajeria: {
        Row: {
          deleted_at: string | null
          estado: Database["public"]["Enums"]["estado_hilo"]
          fecha_creacion: string
          id: string
          id_usuario: string | null
          mensaje: string
          titulo: string
        }
        Insert: {
          deleted_at?: string | null
          estado: Database["public"]["Enums"]["estado_hilo"]
          fecha_creacion?: string
          id?: string
          id_usuario?: string | null
          mensaje: string
          titulo: string
        }
        Update: {
          deleted_at?: string | null
          estado?: Database["public"]["Enums"]["estado_hilo"]
          fecha_creacion?: string
          id?: string
          id_usuario?: string | null
          mensaje?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "HiloMensajeria_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      historico: {
        Row: {
          estado: Database["public"]["Enums"]["estado_historico"]
          fecha: string
          id: number
          id_libro: string
        }
        Insert: {
          estado: Database["public"]["Enums"]["estado_historico"]
          fecha: string
          id?: number
          id_libro: string
        }
        Update: {
          estado?: Database["public"]["Enums"]["estado_historico"]
          fecha?: string
          id?: number
          id_libro?: string
        }
        Relationships: [
          {
            foreignKeyName: "Historico_id_libro_fkey"
            columns: ["id_libro"]
            isOneToOne: false
            referencedRelation: "libro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Historico_id_libro_fkey"
            columns: ["id_libro"]
            isOneToOne: false
            referencedRelation: "vista_inventario"
            referencedColumns: ["libro_id"]
          },
        ]
      }
      item_compra: {
        Row: {
          id: number
          id_compra: string
          id_copia: string
        }
        Insert: {
          id?: number
          id_compra: string
          id_copia: string
        }
        Update: {
          id?: number
          id_compra?: string
          id_copia?: string
        }
        Relationships: [
          {
            foreignKeyName: "ItemCompra_id_compra_fkey"
            columns: ["id_compra"]
            isOneToOne: false
            referencedRelation: "compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ItemCompra_id_copia_fkey"
            columns: ["id_copia"]
            isOneToOne: false
            referencedRelation: "copia"
            referencedColumns: ["id"]
          },
        ]
      }
      item_devolucion: {
        Row: {
          descripcion_motivo: string | null
          id: number
          id_copia: string | null
          id_devolucion: number | null
          motivo: Database["public"]["Enums"]["motivo_devolucion"]
        }
        Insert: {
          descripcion_motivo?: string | null
          id?: number
          id_copia?: string | null
          id_devolucion?: number | null
          motivo: Database["public"]["Enums"]["motivo_devolucion"]
        }
        Update: {
          descripcion_motivo?: string | null
          id?: number
          id_copia?: string | null
          id_devolucion?: number | null
          motivo?: Database["public"]["Enums"]["motivo_devolucion"]
        }
        Relationships: [
          {
            foreignKeyName: "ItemDevolucion_id_copia_fkey"
            columns: ["id_copia"]
            isOneToOne: false
            referencedRelation: "copia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ItemDevolucion_id_devolucion_fkey"
            columns: ["id_devolucion"]
            isOneToOne: false
            referencedRelation: "devolucion"
            referencedColumns: ["id"]
          },
        ]
      }
      libro: {
        Row: {
          ano_publicacion: number | null
          deleted_at: string | null
          editorial: string
          estado: Database["public"]["Enums"]["condicion_libro"]
          fecha_publicacion: string
          id: string
          id_autor: number
          id_categoria: number
          id_modeloRA: number | null
          idioma: string
          isbn: string
          paginas: number
          precio: number
          sipnosis: string
          titulo: string
        }
        Insert: {
          ano_publicacion?: number | null
          deleted_at?: string | null
          editorial: string
          estado: Database["public"]["Enums"]["condicion_libro"]
          fecha_publicacion: string
          id?: string
          id_autor: number
          id_categoria: number
          id_modeloRA?: number | null
          idioma: string
          isbn: string
          paginas: number
          precio: number
          sipnosis: string
          titulo: string
        }
        Update: {
          ano_publicacion?: number | null
          deleted_at?: string | null
          editorial?: string
          estado?: Database["public"]["Enums"]["condicion_libro"]
          fecha_publicacion?: string
          id?: string
          id_autor?: number
          id_categoria?: number
          id_modeloRA?: number | null
          idioma?: string
          isbn?: string
          paginas?: number
          precio?: number
          sipnosis?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "Libro_id_autor_fkey"
            columns: ["id_autor"]
            isOneToOne: false
            referencedRelation: "autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Libro_id_autor_fkey"
            columns: ["id_autor"]
            isOneToOne: false
            referencedRelation: "vista_noticias_completa"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "Libro_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Libro_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "vista_noticias_completa"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "Libro_id_modeloRA_fkey"
            columns: ["id_modeloRA"]
            isOneToOne: false
            referencedRelation: "modelo_ra"
            referencedColumns: ["id"]
          },
        ]
      }
      modelo_ra: {
        Row: {
          deleted_at: string | null
          dimensiones: Json
          id: number
          texturas: Json
        }
        Insert: {
          deleted_at?: string | null
          dimensiones: Json
          id?: number
          texturas: Json
        }
        Update: {
          deleted_at?: string | null
          dimensiones?: Json
          id?: number
          texturas?: Json
        }
        Relationships: []
      }
      noticias: {
        Row: {
          deleted_at: string | null
          es_visible: boolean
          fecha_expiracion: string
          fecha_publicacion: string
          id: string
          id_libro: string
          imagenes: Json | null
          orden: number | null
        }
        Insert: {
          deleted_at?: string | null
          es_visible: boolean
          fecha_expiracion?: string
          fecha_publicacion: string
          id?: string
          id_libro: string
          imagenes?: Json | null
          orden?: number | null
        }
        Update: {
          deleted_at?: string | null
          es_visible?: boolean
          fecha_expiracion?: string
          fecha_publicacion?: string
          id?: string
          id_libro?: string
          imagenes?: Json | null
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "Noticias_id_libro_fkey"
            columns: ["id_libro"]
            isOneToOne: false
            referencedRelation: "libro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Noticias_id_libro_fkey"
            columns: ["id_libro"]
            isOneToOne: false
            referencedRelation: "vista_inventario"
            referencedColumns: ["libro_id"]
          },
        ]
      }
      preferencia_autor: {
        Row: {
          deleted_at: string | null
          id: number
          id_autor: number
          id_usuario: string
        }
        Insert: {
          deleted_at?: string | null
          id?: number
          id_autor: number
          id_usuario: string
        }
        Update: {
          deleted_at?: string | null
          id?: number
          id_autor?: number
          id_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "PreferenciaAutor_id_autor_fkey"
            columns: ["id_autor"]
            isOneToOne: false
            referencedRelation: "autor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PreferenciaAutor_id_autor_fkey"
            columns: ["id_autor"]
            isOneToOne: false
            referencedRelation: "vista_noticias_completa"
            referencedColumns: ["autor_id"]
          },
          {
            foreignKeyName: "PreferenciaAutor_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencia_categoria: {
        Row: {
          deleted_at: string | null
          id: number
          id_categoria: number
          id_usuario: string
        }
        Insert: {
          deleted_at?: string | null
          id?: number
          id_categoria: number
          id_usuario: string
        }
        Update: {
          deleted_at?: string | null
          id?: number
          id_categoria?: number
          id_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "PreferenciaCategoria_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categoria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PreferenciaCategoria_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "vista_noticias_completa"
            referencedColumns: ["categoria_id"]
          },
          {
            foreignKeyName: "PreferenciaCategoria_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      promocion: {
        Row: {
          deleted_at: string | null
          id: number
          nombre: string
          porcentaje_descuento: number
          tipo: string
        }
        Insert: {
          deleted_at?: string | null
          id?: number
          nombre: string
          porcentaje_descuento: number
          tipo: string
        }
        Update: {
          deleted_at?: string | null
          id?: number
          nombre?: string
          porcentaje_descuento?: number
          tipo?: string
        }
        Relationships: []
      }
      reserva: {
        Row: {
          created_at: string
          fecha_expiracion: string
          id: string
          id_copia: string
          id_usuario: string
        }
        Insert: {
          created_at?: string
          fecha_expiracion?: string
          id?: string
          id_copia: string
          id_usuario: string
        }
        Update: {
          created_at?: string
          fecha_expiracion?: string
          id?: string
          id_copia?: string
          id_usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "reserva_id_copia_fkey"
            columns: ["id_copia"]
            isOneToOne: false
            referencedRelation: "copia"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Reserva_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      respuesta: {
        Row: {
          deleted_at: string | null
          fecha_creacion: string
          id: string
          id_hilo: string
          id_usuario: string | null
          mensaje: string
        }
        Insert: {
          deleted_at?: string | null
          fecha_creacion?: string
          id?: string
          id_hilo: string
          id_usuario?: string | null
          mensaje: string
        }
        Update: {
          deleted_at?: string | null
          fecha_creacion?: string
          id?: string
          id_hilo?: string
          id_usuario?: string | null
          mensaje?: string
        }
        Relationships: [
          {
            foreignKeyName: "Respuesta_id_hilo_fkey"
            columns: ["id_hilo"]
            isOneToOne: false
            referencedRelation: "hilo_mensajeria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Respuesta_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      tarjeta: {
        Row: {
          ano_caducidad: number
          deleted_at: string | null
          hash_cvv: string | null
          hash_numero_tarjeta: string | null
          id: number
          id_usuario: string
          mes_caducidad: number
          nombre_titular: string | null
          saldo: number
          ultimos_cuatro_digitos: string
        }
        Insert: {
          ano_caducidad: number
          deleted_at?: string | null
          hash_cvv?: string | null
          hash_numero_tarjeta?: string | null
          id?: number
          id_usuario: string
          mes_caducidad: number
          nombre_titular?: string | null
          saldo: number
          ultimos_cuatro_digitos: string
        }
        Update: {
          ano_caducidad?: number
          deleted_at?: string | null
          hash_cvv?: string | null
          hash_numero_tarjeta?: string | null
          id?: number
          id_usuario?: string
          mes_caducidad?: number
          nombre_titular?: string | null
          saldo?: number
          ultimos_cuatro_digitos?: string
        }
        Relationships: [
          {
            foreignKeyName: "Tarjeta_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      tarjeta_compra: {
        Row: {
          id: number
          id_compra: string
          id_tarjeta: number
          monto: number
        }
        Insert: {
          id?: number
          id_compra: string
          id_tarjeta: number
          monto: number
        }
        Update: {
          id?: number
          id_compra?: string
          id_tarjeta?: number
          monto?: number
        }
        Relationships: [
          {
            foreignKeyName: "TarjetaCompra_id_compra_fkey"
            columns: ["id_compra"]
            isOneToOne: false
            referencedRelation: "compra"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "TarjetaCompra_id_tarjeta_fkey"
            columns: ["id_tarjeta"]
            isOneToOne: false
            referencedRelation: "tarjeta"
            referencedColumns: ["id"]
          },
        ]
      }
      tienda: {
        Row: {
          deleted_at: string | null
          es_bodega: boolean
          horario: Json
          id: string
          id_direccion: number
          nombre: string
        }
        Insert: {
          deleted_at?: string | null
          es_bodega?: boolean
          horario: Json
          id?: string
          id_direccion: number
          nombre: string
        }
        Update: {
          deleted_at?: string | null
          es_bodega?: boolean
          horario?: Json
          id?: string
          id_direccion?: number
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "Tienda_id_direccion_fkey"
            columns: ["id_direccion"]
            isOneToOne: false
            referencedRelation: "direccion"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario: {
        Row: {
          apellidos: string
          created_at: string
          deleted_at: string | null
          dni: string
          fecha_nacimiento: string
          genero: Database["public"]["Enums"]["genero_usuario"]
          id: string
          id_direccion: number
          lugar_nacimiento: string
          nombres: string
        }
        Insert: {
          apellidos: string
          created_at?: string
          deleted_at?: string | null
          dni: string
          fecha_nacimiento: string
          genero: Database["public"]["Enums"]["genero_usuario"]
          id: string
          id_direccion: number
          lugar_nacimiento: string
          nombres: string
        }
        Update: {
          apellidos?: string
          created_at?: string
          deleted_at?: string | null
          dni?: string
          fecha_nacimiento?: string
          genero?: Database["public"]["Enums"]["genero_usuario"]
          id?: string
          id_direccion?: number
          lugar_nacimiento?: string
          nombres?: string
        }
        Relationships: [
          {
            foreignKeyName: "Usuario_id_direccion_fkey"
            columns: ["id_direccion"]
            isOneToOne: false
            referencedRelation: "direccion"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vista_administradores: {
        Row: {
          created_at: string | null
          email: string | null
          habilitado: boolean | null
          id: string | null
          nombre_completo: string | null
          rol: string | null
        }
        Relationships: []
      }
      vista_inventario: {
        Row: {
          autor_libro: string | null
          condicion_libro: Database["public"]["Enums"]["condicion_libro"] | null
          isbn: string | null
          libro_id: string | null
          precio_actual: number | null
          stock_disponible: number | null
          stock_total: number | null
          tienda_id: string | null
          titulo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copia_id_tienda_fkey"
            columns: ["tienda_id"]
            isOneToOne: false
            referencedRelation: "tienda"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_noticias_completa: {
        Row: {
          ano_publicacion: number | null
          autor_id: number | null
          autor_nombre: string | null
          categoria_id: number | null
          categoria_nombre: string | null
          deleted_at: string | null
          editorial: string | null
          es_visible: boolean | null
          estado: Database["public"]["Enums"]["condicion_libro"] | null
          fecha_expiracion: string | null
          fecha_publicacion: string | null
          id: string | null
          id_libro: string | null
          idioma: string | null
          imagenes: Json | null
          isbn: string | null
          libro_fecha_publicacion: string | null
          orden: number | null
          paginas: number | null
          precio: number | null
          sipnosis: string | null
          stock_disponible: number | null
          titulo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Noticias_id_libro_fkey"
            columns: ["id_libro"]
            isOneToOne: false
            referencedRelation: "libro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Noticias_id_libro_fkey"
            columns: ["id_libro"]
            isOneToOne: false
            referencedRelation: "vista_inventario"
            referencedColumns: ["libro_id"]
          },
        ]
      }
    }
    Functions: {
      add_tarjeta_balance: {
        Args: { amount: number; tarjeta_id: number }
        Returns: undefined
      }
      check_username_exists: {
        Args: { username_check: string }
        Returns: boolean
      }
      current_app_role: { Args: never; Returns: string }
    }
    Enums: {
      accion_administrador: "crear" | "modificar" | "eliminar"
      condicion_libro: "nuevo" | "usado"
      estado_copia: "disponible" | "vendido" | "reservado"
      estado_devolucion: "revision" | "cancelado" | "devuelto"
      estado_entrega: "en preparacion" | "enviado" | "entregado"
      estado_hilo: "abierto" | "cerrado"
      estado_historico: "agotado" | "disponible"
      genero_usuario: "masculino" | "femenino" | "otro"
      motivo_devolucion:
        | "producto en mal estado"
        | "no lleno las expectativas"
        | "el pedido llego a un tiempo superior al estipulado"
      tipo_entrega: "envio" | "recogida"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      accion_administrador: ["crear", "modificar", "eliminar"],
      condicion_libro: ["nuevo", "usado"],
      estado_copia: ["disponible", "vendido", "reservado"],
      estado_devolucion: ["revision", "cancelado", "devuelto"],
      estado_entrega: ["en preparacion", "enviado", "entregado"],
      estado_hilo: ["abierto", "cerrado"],
      estado_historico: ["agotado", "disponible"],
      genero_usuario: ["masculino", "femenino", "otro"],
      motivo_devolucion: [
        "producto en mal estado",
        "no lleno las expectativas",
        "el pedido llego a un tiempo superior al estipulado",
      ],
      tipo_entrega: ["envio", "recogida"],
    },
  },
} as const
