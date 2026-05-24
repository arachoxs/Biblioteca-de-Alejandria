"use client"

import { useCallback, useState } from "react"
import type { ReservaAgrupadaItem } from "@/lib/types/reserva"
import { addCartBookAction, cancelCartItemAction, cancelBookReservasAction } from "@/app/(with-navbar)/cartActions"
import { getCartAction } from "@/app/(with-navbar)/cartActions"

type MutingState = Set<string>

interface UseCartMutationsOptions {
  onError: (message: string) => void
  onCartRefresh: () => Promise<void>
}

export function useCartMutations({ onError, onCartRefresh }: UseCartMutationsOptions) {
  const [mutingBooks, setMutingBooks] = useState<MutingState>(new Set())

  const handleIncrement = useCallback(
    async (id_libro: string) => {
      setMutingBooks((prev) => new Set(prev).add(id_libro))
      try {
        const result = await addCartBookAction(id_libro)
        if (!result.success) {
          await onCartRefresh()
          onError(result.message ?? "No se pudo agregar una copia.")
        }
      } catch {
        await onCartRefresh()
        onError("Error inesperado.")
      } finally {
        setMutingBooks((prev) => {
          const next = new Set(prev)
          next.delete(id_libro)
          return next
        })
      }
    },
    [onCartRefresh, onError],
  )

  const handleDecrement = useCallback(
    async (group: ReservaAgrupadaItem) => {
      const targetId = group.reservas[group.reservas.length - 1]?.id_reserva
      if (!targetId) {
        onError("No se encontró reserva.")
        return
      }

      setMutingBooks((prev) => new Set(prev).add(group.id_libro))
      try {
        const result = await cancelCartItemAction(targetId)
        if (!result.success) {
          await onCartRefresh()
          onError(result.message ?? "No se pudo quitar la copia.")
        }
      } catch {
        await onCartRefresh()
        onError("Error inesperado.")
      } finally {
        setMutingBooks((prev) => {
          const next = new Set(prev)
          next.delete(group.id_libro)
          return next
        })
      }
    },
    [onCartRefresh, onError],
  )

  const handleRemoveBook = useCallback(
    async (group: ReservaAgrupadaItem) => {
      const ids = group.reservas.map((r) => r.id_reserva)
      if (ids.length === 0) {
        onError("No hay reservas.")
        return
      }

      setMutingBooks((prev) => new Set(prev).add(group.id_libro))
      try {
        const result = await cancelBookReservasAction(ids)
        if (!result.success) {
          await onCartRefresh()
          onError(result.message ?? "No se pudieron eliminar los libros.")
        }
      } catch {
        await onCartRefresh()
        onError("Error inesperado.")
      } finally {
        setMutingBooks((prev) => {
          const next = new Set(prev)
          next.delete(group.id_libro)
          return next
        })
      }
    },
    [onCartRefresh, onError],
  )

  return {
    mutingBooks,
    handleIncrement,
    handleDecrement,
    handleRemoveBook,
  }
}