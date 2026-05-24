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

async function executeCartMutation<T>(
  bookId: string,
  mutation: () => Promise<{ success: boolean; message?: string }>,
  onError: (message: string) => void,
  onCartRefresh: () => Promise<void>,
): Promise<void> {
  try {
    const result = await mutation()
    if (!result.success) {
      await onCartRefresh()
      onError(result.message ?? "Operación fallida.")
    }
  } catch {
    await onCartRefresh()
    onError("Error inesperado.")
  }
}

export function useCartMutations({ onError, onCartRefresh }: UseCartMutationsOptions) {
  const [mutingBooks, setMutingBooks] = useState<MutingState>(new Set())

  const withMutingBook = useCallback(
    async (bookId: string, mutation: () => Promise<{ success: boolean; message?: string }>) => {
      setMutingBooks((prev) => new Set(prev).add(bookId))
      try {
        const result = await mutation()
        if (!result.success) {
          await onCartRefresh()
          onError(result.message ?? "Operación fallida.")
        }
      } catch {
        await onCartRefresh()
        onError("Error inesperado.")
      } finally {
        setMutingBooks((prev) => {
          const next = new Set(prev)
          next.delete(bookId)
          return next
        })
      }
    },
    [onCartRefresh, onError],
  )

  const handleIncrement = useCallback(
    async (id_libro: string) => {
      await withMutingBook(id_libro, () => addCartBookAction(id_libro))
    },
    [withMutingBook],
  )

  const handleDecrement = useCallback(
    async (group: ReservaAgrupadaItem) => {
      const targetId = group.reservas[group.reservas.length - 1]?.id_reserva
      if (!targetId) {
        onError("No se encontró reserva.")
        return
      }
      await withMutingBook(group.id_libro, () => cancelCartItemAction(targetId))
    },
    [withMutingBook, onError],
  )

  const handleRemoveBook = useCallback(
    async (group: ReservaAgrupadaItem) => {
      const ids = group.reservas.map((r) => r.id_reserva)
      if (ids.length === 0) {
        onError("No hay reservas.")
        return
      }
      await withMutingBook(group.id_libro, () => cancelBookReservasAction(ids))
    },
    [withMutingBook, onError],
  )

  return {
    mutingBooks,
    handleIncrement,
    handleDecrement,
    handleRemoveBook,
  }
}