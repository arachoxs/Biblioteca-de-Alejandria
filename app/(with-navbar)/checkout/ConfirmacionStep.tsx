"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Truck,
  Store,
  Home,
  CreditCard,
  CheckCircle2,
  Loader2,
  BookOpen,
  Copy,
  ArrowRight,
} from "lucide-react"
import type { OpcionEnvio, TarjetaPaymentAllocation } from "@/lib/types/checkout"
import type { ReservaAgrupadaItem } from "@/lib/types/reserva"
import { confirmarCompraAction } from "./actions"
import Alert from "@/components/ui/Alert"

const PRICE_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
})

function formatPrice(price: number): string {
  return PRICE_FORMATTER.format(price)
}

interface PurchaseResult {
  compraId: string
  fechaEntregaEstimada?: string
}

interface ConfirmacionStepProps {
  envioOpcion: OpcionEnvio | null
  paymentAllocations: TarjetaPaymentAllocation[]
  totalConEnvio: number
  cartData: ReservaAgrupadaItem[]
  idTiendaDestino: string
  onBack: () => void
  onPurchaseComplete: () => void
}

interface CardDisplay {
  id_tarjeta: number
  ultimos_cuatro_digitos: string
  monto: number
}

function getTipoTexto(envioOpcion: OpcionEnvio | null): string {
  if (!envioOpcion) return "No seleccionado"
  if (envioOpcion.tipo === "domicilio") return "Envío a domicilio"
  if (envioOpcion.tipo === "traslado") return `Traslado a ${envioOpcion.tiendaNombre}`
  return `Recogida en ${envioOpcion.tiendaNombre}`
}

function getCartSummary(cartData: ReservaAgrupadaItem[]) {
  const subtotal = cartData.reduce((s, g) => s + g.precio * g.copias_reservadas, 0)
  const totalArticulos = cartData.reduce((s, g) => s + g.copias_reservadas, 0)
  const copias = cartData.flatMap((g) => g.reservas.map((r) => ({ id_copia: r.id_copia })))

  return { subtotal, totalArticulos, copias }
}

function buildTarjetas(
  paymentAllocations: TarjetaPaymentAllocation[],
): CardDisplay[] {
  return paymentAllocations.map((a) => ({
    id_tarjeta: a.id_tarjeta,
    ultimos_cuatro_digitos: String(a.id_tarjeta).padStart(4, "0").slice(-4),
    monto: a.monto,
  }))
}

function buildConfirmPayload({
  subtotal,
  totalConEnvio,
  copias,
  paymentAllocations,
  envioOpcion,
  idTiendaDestino,
}: {
  subtotal: number
  totalConEnvio: number
  copias: { id_copia: string }[]
  paymentAllocations: TarjetaPaymentAllocation[]
  envioOpcion: OpcionEnvio
  idTiendaDestino: string
}) {
  return {
    subtotal,
    total: totalConEnvio,
    copias,
    tarjetas: paymentAllocations.map((a) => ({
      id_tarjeta: a.id_tarjeta,
      monto: a.monto,
    })),
    entrega: {
      tipo: envioOpcion.tipo,
      id_tienda_destino: idTiendaDestino,
      costo: envioOpcion.costo,
    },
  }
}

function scrollCheckoutTop() {
  document
    .getElementById("checkout-scroll-container")
    ?.scrollTo({ top: 0, behavior: "smooth" })
}

function getSubmitErrorMessage(errors?: Record<string, string>) {
  const errorMessages = Object.values(errors ?? {})
  return errorMessages.length > 0
    ? errorMessages.join(". ")
    : "Error al procesar la compra."
}

function useConfirmacionAction({
  envioOpcion,
  subtotal,
  totalConEnvio,
  copias,
  paymentAllocations,
  idTiendaDestino,
  onPurchaseComplete,
}: {
  envioOpcion: OpcionEnvio | null
  subtotal: number
  totalConEnvio: number
  copias: { id_copia: string }[]
  paymentAllocations: TarjetaPaymentAllocation[]
  idTiendaDestino: string
  onPurchaseComplete: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [purchaseResult, setPurchaseResult] = useState<PurchaseResult | null>(null)

  const handleConfirm = async () => {
    if (confirming || !envioOpcion) return
    setConfirming(true)
    setSubmitError(null)

    const result = await confirmarCompraAction(
      buildConfirmPayload({
        subtotal,
        totalConEnvio,
        copias,
        paymentAllocations,
        envioOpcion,
        idTiendaDestino,
      }),
    )

    if (result.success && result.compraId) {
      setPurchaseResult({
        compraId: result.compraId,
        fechaEntregaEstimada: result.fechaEntregaEstimada,
      })
      onPurchaseComplete()
      setConfirming(false)
      scrollCheckoutTop()
      return
    }

    setSubmitError(getSubmitErrorMessage(result.errors))
    setConfirming(false)
  }

  return {
    confirming,
    submitError,
    purchaseResult,
    handleConfirm,
    clearSubmitError: () => setSubmitError(null),
  }
}

export default function ConfirmacionStep({
  envioOpcion,
  paymentAllocations,
  totalConEnvio,
  cartData,
  idTiendaDestino,
  onBack,
  onPurchaseComplete,
}: ConfirmacionStepProps) {
  const router = useRouter()
  const tipoTexto = getTipoTexto(envioOpcion)
  const costoEnvio = envioOpcion?.costo ?? 0
  const { subtotal, totalArticulos, copias } = getCartSummary(cartData)
  const tarjetas = buildTarjetas(paymentAllocations)
  const { confirming, submitError, purchaseResult, handleConfirm, clearSubmitError } =
    useConfirmacionAction({
      envioOpcion,
      subtotal,
      totalConEnvio,
      copias,
      paymentAllocations,
      idTiendaDestino,
      onPurchaseComplete,
    })

  if (purchaseResult) {
    return (
      <SuccessView
        compraId={purchaseResult.compraId}
        totalConEnvio={totalConEnvio}
        totalArticulos={totalArticulos}
        tipoTexto={tipoTexto}
        envioOpcion={envioOpcion}
        fechaEntregaEstimada={purchaseResult.fechaEntregaEstimada}
        onGoHome={() => router.push("/")}
      />
    )
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="relative bg-gradient-to-r from-brand-primary/[0.04] to-transparent rounded-2xl border border-brand-primary/10 overflow-hidden checkout-fade-in">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary/40 to-brand-accent/20" />
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-brand-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.15em] text-brand-secondary/40 mb-1">
                Total a pagar
              </p>
              <p className="font-display text-2xl font-bold text-brand-text leading-none tabular-nums">
                {formatPrice(totalConEnvio)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <BooksSummaryCard cartData={cartData} />

      <SectionDividerConfirm label="Método de entrega" />

      <EnvioSummaryCard envioOpcion={envioOpcion} tipoTexto={tipoTexto} costoEnvio={costoEnvio} />

      <SectionDividerConfirm label="Método de pago" />

      <div className="space-y-3">
        {tarjetas.map((tarjeta, index) => (
          <div
            key={tarjeta.id_tarjeta}
            className="bg-white rounded-2xl border border-brand-accent/10 p-5 transition-all duration-200 checkout-fade-in"
            style={{ animationDelay: `${index * 80}ms` }}>
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5 text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-base font-semibold text-brand-text leading-tight">
                  •••• {tarjeta.ultimos_cuatro_digitos}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-brand-text tabular-nums">
                  {formatPrice(tarjeta.monto)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {submitError && (
        <Alert variant="error" onClose={clearSubmitError}>
          {submitError}
        </Alert>
      )}

      <div className="flex items-center gap-3 pt-1" id="continue-button-container">
        <button
          type="button"
          onClick={onBack}
          disabled={confirming}
          className="px-5 py-3 text-sm font-medium text-brand-secondary hover:text-brand-text border border-brand-accent/15 rounded-xl hover:border-brand-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          Volver
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={confirming}
          className="flex-1 px-5 py-3 bg-brand-primary text-white text-sm font-medium rounded-xl hover:bg-brand-primary/90 active:scale-[0.98] transition-all disabled:bg-brand-accent/30 disabled:text-white/40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer">
          {confirming ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Confirmando...
            </span>
          ) : (
            "Confirmar pedido"
          )}
        </button>
      </div>
    </div>
  )
}

function SectionDividerConfirm({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-brand-secondary/30 font-medium">
        {label}
      </span>
      <div className="flex-1 h-px bg-brand-accent/8" />
    </div>
  )
}

function EnvioSummaryCard({
  envioOpcion,
  tipoTexto,
  costoEnvio,
}: {
  envioOpcion: OpcionEnvio | null
  tipoTexto: string
  costoEnvio: number
}) {
  const icon = !envioOpcion
    ? <Truck className="w-5 h-5" />
    : envioOpcion.tipo === "domicilio"
      ? <Home className="w-5 h-5" />
      : <Store className="w-5 h-5" />

  return (
    <div className="bg-white rounded-2xl border border-brand-accent/10 p-5 checkout-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
          <div className="text-brand-primary">{icon}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base font-semibold text-brand-text leading-tight">
            {tipoTexto}
          </p>
          {envioOpcion?.tiendaDireccion && (
            <p className="text-xs text-brand-secondary/50 mt-0.5 truncate">
              {envioOpcion.tiendaDireccion}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          {costoEnvio > 0 ? (
            <span className="text-sm font-semibold text-brand-text tabular-nums">
              {formatPrice(costoEnvio)}
            </span>
          ) : (
            <span className="text-xs font-medium text-success bg-success/10 px-3 py-1 rounded-lg border border-success/20">
              Gratis
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function BooksSummaryCard({ cartData }: { cartData: ReservaAgrupadaItem[] }) {
  const totalArticulos = cartData.reduce((s, g) => s + g.copias_reservadas, 0)
  const librosUnicos = cartData.length

  return (
    <div className="bg-white rounded-2xl border border-brand-accent/10 p-5 checkout-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-brand-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-base font-semibold text-brand-text leading-tight">
            {librosUnicos} {librosUnicos === 1 ? "título" : "títulos"}
          </p>
          <p className="text-xs text-brand-secondary/50 mt-0.5">
            {totalArticulos} {totalArticulos === 1 ? "copia" : "copias"}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {cartData.slice(0, 3).map((item) => (
          <div key={item.id_libro} className="flex items-center justify-between text-sm">
            <span className="text-brand-text truncate pr-4">{item.titulo}</span>
            <span className="text-brand-secondary/60 shrink-0">×{item.copias_reservadas}</span>
          </div>
        ))}
        {cartData.length > 3 && (
          <p className="text-xs text-brand-secondary/50">+{cartData.length - 3} más</p>
        )}
      </div>
    </div>
  )
}

function formatFechaEstimada(iso?: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
}

function SuccessView({
  compraId,
  totalConEnvio,
  totalArticulos,
  tipoTexto,
  envioOpcion,
  fechaEntregaEstimada,
  onGoHome,
}: {
  compraId: string
  totalConEnvio: number
  totalArticulos: number
  tipoTexto: string
  envioOpcion: OpcionEnvio | null
  fechaEntregaEstimada?: string
  onGoHome: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compraId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-brand-accent/10 p-8 lg:p-10 text-center success-glow">
        <div className="flex justify-center mb-6 success-icon-in">
          <div className="w-16 h-16 rounded-full bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </div>

        <h2 className="font-display text-2xl lg:text-3xl font-bold text-brand-text leading-tight success-text-in">
          ¡Pedido confirmado!
        </h2>
        <p className="text-brand-secondary/70 text-sm mt-2 max-w-xs mx-auto leading-relaxed success-text-in">
          Tu compra se ha procesado correctamente.
          {envioOpcion?.tipo === "domicilio"
            ? " Prepara tu hogar para recibir los libros."
            : " Dirígete a la tienda cuando te notifiquemos que están listos."}
        </p>

        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 bg-brand-bg/60 rounded-xl border border-brand-accent/10 success-detail-in">
          <span className="text-[10px] uppercase tracking-[0.15em] text-brand-secondary/40 font-medium">
            N.° de pedido
          </span>
          <span className="font-mono text-sm font-semibold text-brand-text tabular-nums tracking-wide">
            {compraId.slice(0, 8).toUpperCase()}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-md text-brand-secondary/30 hover:text-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer"
            aria-label="Copiar número de pedido"
          >
            {copied ? (
              <span className="text-xs font-medium text-success">Copiado</span>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-accent/10 p-5 success-delay-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/8 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-brand-primary" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-brand-text leading-tight">
                {totalArticulos} {totalArticulos === 1 ? "libro" : "libros"}
              </p>
            </div>
          </div>
          <span className="font-display text-xl font-bold text-brand-text tabular-nums">
            {formatPrice(totalConEnvio)}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-brand-accent/10 p-5 success-delay-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/8 flex items-center justify-center shrink-0">
            {envioOpcion?.tipo === "domicilio" ? (
              <Home className="w-5 h-5 text-brand-primary" />
            ) : (
              <Store className="w-5 h-5 text-brand-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-base font-semibold text-brand-text leading-tight">
              {tipoTexto}
            </p>
            {fechaEntregaEstimada && (
              <p className="text-xs text-brand-secondary/50 mt-0.5">
                Llega alrededor del {formatFechaEstimada(fechaEntregaEstimada)}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2 success-delay-4">
        <button
          type="button"
          onClick={onGoHome}
          className="w-full py-3.5 px-5 bg-brand-primary text-white text-sm font-medium rounded-xl hover:bg-brand-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer group"
        >
          Explorar catálogo
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  )
}
