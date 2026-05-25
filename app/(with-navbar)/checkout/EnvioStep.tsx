"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Truck,
  Store,
  AlertTriangle,
  Loader2,
  Navigation,
  Home,
  Check,
  Clock,
} from "lucide-react"
import { calcularEnvioAction, getProfileAddressAction, getProfileFullAddressAction } from "./actions"
import type { ResultadoEnvio, OpcionEnvio } from "@/lib/types/checkout"

type EnvioStepStatus = "loading" | "gathering-location" | "ready" | "error"

const PRICE_FORMATTER = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  minimumFractionDigits: 0,
})

const GEOLOCATION_OPTIONS = { timeout: 5000, enableHighAccuracy: false }

function formatPrice(price: number): string {
  return PRICE_FORMATTER.format(price)
}

function getBrowserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) return Promise.resolve(null)

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      GEOLOCATION_OPTIONS,
    )
  })
}

async function resolvePlaceId(): Promise<string | undefined> {
  const browserLoc = await getBrowserLocation()
  if (!browserLoc) return undefined
  const placeId = await getProfileAddressAction()
  return placeId ?? undefined
}

export default function EnvioStep({
  onConfirm,
  onBack,
}: {
  onConfirm: (opcion: OpcionEnvio) => void
  onBack: () => void
}) {
  const [status, setStatus] = useState<EnvioStepStatus>("loading")
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null)
  const [selectedOption, setSelectedOption] = useState<OpcionEnvio | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [userPlaceId, setUserPlaceId] = useState<string | null>(null)
  const [userDireccionFormateada, setUserDireccionFormateada] = useState<string | null>(null)

  const fetchOptions = useCallback(async (placeId?: string) => {
    setStatus("loading")
    setErrorMsg(null)
    if (placeId) setUserPlaceId(placeId)
    try {
      const result = await calcularEnvioAction(placeId)
      if (result.tiendaMasCercana && result.opciones.length > 0) {
        setResultado(result)
        setStatus("ready")
      } else {
        setErrorMsg("No se pudieron calcular las opciones de envío.")
        setStatus("error")
      }
    } catch {
      setErrorMsg("Error al calcular opciones de envío.")
      setStatus("error")
    }
  }, [])

  useEffect(() => {
    async function init() {
      setStatus("gathering-location")
      const placeId = await resolvePlaceId()
      if (placeId) {
        setUserPlaceId(placeId)
        const fullAddr = await getProfileFullAddressAction()
        setUserDireccionFormateada(fullAddr.direccionFormateada)
        await fetchOptions(placeId)
      } else {
        setErrorMsg(
          "No pudimos detectar tu ubicación. Asegúrate de tener una dirección registrada en tu perfil.",
        )
        setStatus("error")
      }
    }

    init()
  }, [fetchOptions])

  const handleConfirm = useCallback(() => {
    if (selectedOption) {
      onConfirm(selectedOption)
    }
  }, [selectedOption, onConfirm])

  if (status === "loading" || status === "gathering-location") {
    return <LoadingSkeleton status={status} />
  }

  if (status === "error") {
    return (
      <ErrorView
        message={errorMsg ?? "Error al calcular opciones de envío."}
        onRetry={() => fetchOptions()}
        onBack={onBack}
      />
    )
  }

  return <ReadyView resultado={resultado} selectedOption={selectedOption} userPlaceId={userPlaceId} userDireccionFormateada={userDireccionFormateada} onSelect={setSelectedOption} onBack={onBack} onConfirm={handleConfirm} />
}

function LoadingSkeleton({ status }: { status: "loading" | "gathering-location" }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-brand-accent/10 p-5 flex gap-4 animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <div className="w-12 h-12 rounded-full bg-brand-accent/8 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="h-5 w-2/3 bg-brand-accent/10 rounded-lg" />
            <div className="h-4 w-1/2 bg-brand-accent/6 rounded-lg" />
          </div>
          <div className="w-20 h-8 bg-brand-accent/8 rounded-xl shrink-0" />
        </div>
      ))}
      <div className="flex items-center gap-3 pt-2">
        <div className="h-12 w-28 bg-brand-accent/6 rounded-xl animate-pulse" />
        <div className="h-12 flex-1 bg-brand-primary/15 rounded-xl animate-pulse" />
      </div>
      <div className="flex items-center justify-center pt-4 gap-2">
        <Loader2 className="w-4 h-4 text-brand-primary/40 animate-spin" />
        <p className="text-xs text-brand-secondary/40">
          {status === "gathering-location" ? "Detectando ubicación..." : "Calculando opciones..."}
        </p>
      </div>
    </div>
  )
}

function ErrorView({
  message,
  onRetry,
  onBack,
}: {
  message: string
  onRetry: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5 ring-8 ring-red-50/50">
        <AlertTriangle className="w-6 h-6 text-red-400" />
      </div>
      <p className="text-sm text-brand-secondary/80 max-w-sm leading-relaxed">{message}</p>
      <div className="flex items-center gap-2.5 mt-6">
        <button
          type="button"
          onClick={onRetry}
          className="px-5 py-2.5 bg-brand-primary text-white text-sm font-medium rounded-xl hover:bg-brand-primary/90 transition-all cursor-pointer"
        >
          Reintentar
        </button>
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-medium text-brand-secondary/60 hover:text-brand-text border border-brand-accent/15 rounded-xl hover:border-brand-accent/30 transition-all cursor-pointer"
        >
          Volver al carrito
        </button>
      </div>
    </div>
  )
}

function deriveEnvioOptions(resultado: ResultadoEnvio | null, selectedOption: OpcionEnvio | null) {
  const opciones = resultado?.opciones ?? []
  const domicilio = opciones.find((o) => o.tipo === "domicilio")
  const recogidaTraslado = opciones.filter((o) => o.tipo !== "domicilio")
  const domicilioSelected = selectedOption?.tipo === "domicilio"
  return { domicilio, recogidaTraslado, domicilioSelected }
}

function DomicilioOptionCard({
  option,
  userDireccionFormateada,
  selected,
  onSelect,
}: {
  option: OpcionEnvio
  userDireccionFormateada: string | null
  selected: boolean
  onSelect: () => void
}) {
  return (
    <OptionCard
      icon={<Home className="w-5 h-5" />}
      title="Envío a domicilio"
      description={userDireccionFormateada ? `A tu dirección: ${userDireccionFormateada}` : option.mensaje}
      selected={selected}
      costo={option.costo}
      onSelect={onSelect}
    />
  )
}

function RecogidaOptionsList({
  opciones,
  selectedOption,
  onSelect,
}: {
  opciones: OpcionEnvio[]
  selectedOption: OpcionEnvio | null
  onSelect: (option: OpcionEnvio) => void
}) {
  return (
    <>
      {opciones.map((opcion, idx) => (
        <OptionCard
          key={`${opcion.tipo}-${opcion.tiendaId ?? idx}`}
          icon={opcion.tipo === "traslado" ? <Truck className="w-5 h-5" /> : <Store className="w-5 h-5" />}
          title={opcion.tipo === "traslado" ? `Traslado a ${opcion.tiendaNombre}` : `Recoger en ${opcion.tiendaNombre}`}
          description={opcion.mensaje}
          selected={selectedOption?.tiendaId === opcion.tiendaId}
          costo={opcion.costo}
          onSelect={() => onSelect(opcion)}
          badge={opcion.requiereTraslado && opcion.tipo !== "traslado" ? <TrasladoBadge /> : undefined}
          detail={<OptionDetail opcion={opcion} />}
        />
      ))}
    </>
  )
}

function ReadyView({
  resultado,
  selectedOption,
  userPlaceId,
  userDireccionFormateada,
  onSelect,
  onBack,
  onConfirm,
}: {
  resultado: ResultadoEnvio | null
  selectedOption: OpcionEnvio | null
  userPlaceId: string | null
  userDireccionFormateada: string | null
  onSelect: (option: OpcionEnvio) => void
  onBack: () => void
  onConfirm: () => void
}) {
  const nearest = resultado?.tiendaMasCercana
  const { domicilio, recogidaTraslado, domicilioSelected } = deriveEnvioOptions(resultado, selectedOption)

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {nearest && <NearestStoreCard nearest={nearest} />}

      <SectionDivider label="Elige tu método" />

      <div className="grid gap-3">
        {domicilio && (
          <DomicilioOptionCard
            option={domicilio}
            userDireccionFormateada={userDireccionFormateada}
            selected={domicilioSelected}
            onSelect={() => onSelect(domicilio)}
          />
        )}

        {recogidaTraslado.length > 0 && (
          <RecogidaOptionsList
            opciones={recogidaTraslado}
            selectedOption={selectedOption}
            onSelect={onSelect}
          />
        )}
      </div>

      {userPlaceId && selectedOption?.tiendaPlaceId && (
        <RouteMap userPlaceId={userPlaceId} selectedOption={selectedOption} />
      )}

      <CheckoutActionsFooter selectedOption={selectedOption} onBack={onBack} onConfirm={onConfirm} />
    </div>
  )
}

function CheckoutActionsFooter({
  selectedOption,
  onBack,
  onConfirm,
}: {
  selectedOption: OpcionEnvio | null
  onBack: () => void
  onConfirm: (option: OpcionEnvio) => void
}) {
  return (
    <div className="flex items-center gap-3 pt-2" id="continue-button-container">
      <button
        type="button"
        onClick={onBack}
        className="px-5 py-3 text-sm font-medium text-brand-secondary/50 hover:text-brand-text border border-brand-accent/15 rounded-xl hover:border-brand-accent/30 transition-all cursor-pointer"
      >
        Volver
      </button>
      <button
        type="button"
        onClick={() => { if (selectedOption) onConfirm(selectedOption) }}
        disabled={!selectedOption}
        className="flex-1 px-5 py-3 bg-brand-primary text-white text-sm font-medium rounded-xl hover:bg-brand-primary/90 active:scale-[0.98] transition-all disabled:bg-brand-accent/30 disabled:text-white/40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
      >
        {selectedOption
          ? selectedOption.tipo === "domicilio"
            ? "Confirmar envío a domicilio"
            : "Continuar"
          : "Selecciona un método de entrega"}
      </button>
    </div>
  )
}

function NearestStoreCard({ nearest }: { nearest: NonNullable<ResultadoEnvio["tiendaMasCercana"]> }) {
  return (
    <div className="relative bg-gradient-to-r from-brand-primary/[0.04] to-transparent rounded-2xl border border-brand-primary/10 overflow-hidden checkout-fade-in">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary/40 to-brand-accent/20" />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-brand-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] text-brand-secondary/40 mb-1">
              Tienda más cercana
            </p>
            <p className="font-display text-xl font-semibold text-brand-text leading-tight">
              {nearest.nombre}
            </p>
            <p className="text-sm text-brand-secondary/60 mt-1 leading-snug">
              {nearest.direccion_formateada}
            </p>
          </div>
          <div className="shrink-0">
            <div className="px-3.5 py-2 bg-brand-primary/8 rounded-xl text-center min-w-[4.5rem]">
              <p className="font-display text-xl font-bold text-brand-primary leading-none">
                {nearest.distanciaKm.toFixed(1)}
              </p>
              <p className="text-[10px] text-brand-secondary/50 mt-0.5 uppercase tracking-wider">km</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-[0.2em] text-brand-secondary/30 font-medium">
        {label}
      </span>
      <div className="flex-1 h-px bg-brand-accent/8" />
    </div>
  )
}

function TrasladoBadge() {
  return (
    <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
      Traslado requerido
    </span>
  )
}

function OptionDetail({ opcion }: { opcion: OpcionEnvio }) {
  const hasSwappedBooks = opcion.swappedBooks && opcion.swappedBooks.length > 0
  const hasTrasladoDetalle = !!opcion.trasladoDetalle

  if (!hasSwappedBooks && !hasTrasladoDetalle) return null

  return (
    <div className="mt-2 space-y-1">
      {hasSwappedBooks && (
        <div className="flex items-start gap-1.5 text-xs text-emerald-600">
          <Check className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{opcion.swappedBooks!.length} libro(s) optimizados para pickup</span>
        </div>
      )}
      {hasTrasladoDetalle && (
        <div className="flex items-start gap-1.5 text-xs text-amber-600">
          <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            {opcion.trasladoDetalle!.libroIds.length} libro(s) llegará(n) en {opcion.trasladoDetalle!.diasLaborales} días hábiles
          </span>
        </div>
      )}
    </div>
  )
}

function RouteMap({ userPlaceId, selectedOption }: { userPlaceId: string; selectedOption: OpcionEnvio }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-brand-accent/10 bg-white shadow-sm checkout-fade-in">
      <div className="px-5 pt-4 pb-2.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-primary/8 flex items-center justify-center shrink-0">
          <Navigation className="w-4 h-4 text-brand-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-brand-text">
            Tu ubicación → <span className="font-semibold">{selectedOption.tiendaNombre ?? "Tienda"}</span>
          </p>
          <p className="text-[11px] text-brand-secondary/50 mt-0.5 truncate">{selectedOption.tiendaDireccion}</p>
        </div>
      </div>
      <div className="w-full h-56 lg:h-72 border-t border-brand-accent/5">
        <iframe
          title="Mapa de ruta"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&origin=place_id:${userPlaceId}&destination=place_id:${selectedOption.tiendaPlaceId}&mode=driving`}
        />
      </div>
    </div>
  )
}

function OptionCard({
  icon,
  title,
  description,
  selected,
  costo,
  onSelect,
  badge,
  detail,
}: {
  icon: React.ReactNode
  title: string
  description: string
  selected: boolean
  costo: number
  onSelect: () => void
  badge?: React.ReactNode
  detail?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 cursor-pointer group ${
        selected
          ? "border-brand-primary bg-gradient-to-br from-brand-primary/[0.04] to-transparent shadow-lg shadow-brand-primary/5"
          : "border-brand-accent/8 bg-white hover:border-brand-accent/25 hover:shadow-md hover:shadow-brand-accent/5 hover:-translate-y-0.5"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 ${
            selected
              ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
              : "bg-brand-accent/8 text-brand-secondary group-hover:bg-brand-accent/15 group-hover:text-brand-text"
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-lg font-semibold text-brand-text">{title}</span>
            {badge}
          </div>
          <p className="text-sm text-brand-secondary/70 mt-1 leading-relaxed">{description}</p>
          {detail}
        </div>
        <div className="shrink-0 mt-0.5">
          {costo > 0 ? (
            <span className="font-display text-lg font-bold text-brand-text tabular-nums">{formatPrice(costo)}</span>
          ) : (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/50">
              Gratis
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
