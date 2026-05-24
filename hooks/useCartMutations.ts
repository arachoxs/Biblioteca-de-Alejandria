"use client"

import { useCallback, useState } from "react"
import type { ReservaAgrupadaItem } from "@/lib/types/reserva"
import { addCartBookAction, cancelCartItemAction, cancelBookReservasAction } from "@/app/(with-navbar)/cartActions"
import { getCartAction } from "@/app/(with-navbar)/cartActions"

type MutingState = Set<string>

export function useCartMutations() {
  const [mutingBooks, setMutingBooks] = useState<MutingState>(new Set())

  const fetchCart = useCallback(async () => {
    const result = await getCartAction()
    return result
  }, [])

  const handleIncrement = useCallback(
    async (id_libro: string) => {
      setMutingBooks((prev) => new Set(prev).add(id_libro))
      try {
        const result = await addCartBookAction(id_libro)
        return result
      } finally {
        setMutingBooks((prev) => {
          const next = new Set(prev)
          next.delete(id_libro)
          return next
        })
      }
    },
    [],
  )

  const handleDecrement = useCallback(
    async (group: ReservaAgrupadaItem) => {
      const targetId = group.reservas[group.reservas.length - 1]?.id_reserva
      if (!targetId) return { success: false, message: "No se encontró reserva." }

      setMutingBooks((prev) => new Set(prev).add(group.id_libro))
      try {
        const result = await cancelCartItemAction(targetId)
        return result
      } finally {
        setMutingBooks((prev) => {
          const next = new Set(prev)
          next.delete(group.id_libro)
          return next
        })
      }
    },
    [],
  )

  const handleRemoveBook = useCallback(
    async (group: ReservaAgrupadaItem) => {
      const ids = group.reservas.map((r) => r.id_reserva)
      if (ids.length === 0) return { success: false, message: "No hay reservas." }

      setMutingBooks((prev) => new Set(prev).add(group.id_libro))
      try {
        const result = await cancelBookReservasAction(ids)
        return result
      } finally {
        setMutingBooks((prev) => {
          const next = new Set(prev)
          next.delete(group.id_libro)
          return next
        })
      }
    },
    [],
  )

  return {
    mutingBooks,
    handleIncrement,
    handleDecrement,
    handleRemoveBook,
    fetchCart,
  }
}