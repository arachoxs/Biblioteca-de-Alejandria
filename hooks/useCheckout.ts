"use client"

import { useState, useCallback, useMemo } from "react"
import type { OpcionEnvio } from "@/lib/types/checkout"
import type { ReservaAgrupadaItem } from "@/lib/types/reserva"

type Step = "carrito" | "envio" | "pago"

export function useCheckoutState() {
  const [currentStep, setCurrentStep] = useState<Step>("carrito")
  const [envioOpcion, setEnvioOpcion] = useState<OpcionEnvio | null>(null)

  const goToEnvio = useCallback(() => setCurrentStep("envio"), [])
  const goToCarrito = useCallback(() => setCurrentStep("carrito"), [])
  const goToPago = useCallback(
    (opcion: OpcionEnvio): boolean => {
      if (!opcion) return false
      setEnvioOpcion(opcion)
      setCurrentStep("pago")
      return true
    },
    [],
  )

  return {
    currentStep,
    envioOpcion,
    goToEnvio,
    goToCarrito,
    goToPago,
  }
}

export function useCartSummary(cartData: ReservaAgrupadaItem[] | null, envioOpcion: OpcionEnvio | null) {
  return useMemo(() => {
    const total = cartData?.reduce((sum, item) => sum + item.precio * item.copias_reservadas, 0) ?? 0
    const costoEnvio = envioOpcion?.costo ?? 0
    const totalConEnvio = total + costoEnvio
    const itemCount = cartData?.reduce((s, g) => s + g.copias_reservadas, 0) ?? 0
    return { total, costoEnvio, totalConEnvio, itemCount }
  }, [cartData, envioOpcion])
}

export function useSummarySheet() {
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [sheetClosing, setSheetClosing] = useState(false)

  const openSummary = useCallback(() => setSummaryExpanded(true), [])
  const closeSummary = useCallback(() => {
    setSheetClosing(true)
    setTimeout(() => {
      setSheetClosing(false)
      setSummaryExpanded(false)
    }, 250)
  }, [])

  return { summaryExpanded, sheetClosing, openSummary, closeSummary }
}