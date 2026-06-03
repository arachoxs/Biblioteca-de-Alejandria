"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import HiloCard from "@/components/mensajeria/HiloCard";
import ConversacionView from "@/components/mensajeria/ConversacionView";
import {
  agregarRespuestaAdminAction,
  cerrarHiloAdminAction,
  reabrirHiloAdminAction,
  getAllHilosAdminAction,
  getHiloDetalleAdminAction,
  getStatsAdminAction,
} from "./actions";
import type { HiloListItem, HiloWithRespuestas, HiloStats, EstadoHilo } from "@/lib/types/hiloMensajeria";
import type { Paginated } from "@/lib/types/common";

type Vista = "lista" | "detalle";

export default function MensajeriaAdminPage() {
  const [vista, setVista] = useState<Vista>("lista");
  const [hilos, setHilos] = useState<Paginated<HiloListItem>>({
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  });
  const [stats, setStats] = useState<HiloStats>({
    total: 0,
    abiertos: 0,
    cerrados: 0,
    no_leidos: 0,
  });
  const [hiloSeleccionado, setHiloSeleccionado] = useState<HiloWithRespuestas | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<EstadoHilo | undefined>(undefined);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const cargarHilos = useCallback(async () => {
    try {
      const [hilosData, statsData] = await Promise.all([
        getAllHilosAdminAction(1, 10, filtroEstado),
        getStatsAdminAction(),
      ]);
      setHilos(hilosData);
      setStats(statsData);
    } catch (error) {
      console.error("Error cargando hilos:", error);
    } finally {
      setCargando(false);
    }
  }, [filtroEstado]);

  useEffect(() => {
    cargarHilos();
  }, [cargarHilos]);

  async function handleHiloClick(hiloId: string) {
    try {
      setCargando(true);
      const hilo = await getHiloDetalleAdminAction(hiloId);
      if (hilo) {
        setHiloSeleccionado(hilo);
        setVista("detalle");
        await cargarHilos();
      }
    } catch (error) {
      console.error("Error cargando hilo:", error);
    } finally {
      setCargando(false);
    }
  }

  async function handleEnviarRespuesta(mensaje: string) {
    if (!hiloSeleccionado) return;

    try {
      setEnviando(true);
      const result = await agregarRespuestaAdminAction(hiloSeleccionado.id, mensaje);
      if (result.success) {
        const hiloActualizado = await getHiloDetalleAdminAction(hiloSeleccionado.id);
        if (hiloActualizado) {
          setHiloSeleccionado(hiloActualizado);
        }
        await cargarHilos();
      }
    } catch (error) {
      console.error("Error enviando respuesta:", error);
    } finally {
      setEnviando(false);
    }
  }

  async function handleCerrarHilo() {
    if (!hiloSeleccionado) return;

    try {
      setEnviando(true);
      const result = await cerrarHiloAdminAction(hiloSeleccionado.id);
      if (result.success) {
        const hiloActualizado = await getHiloDetalleAdminAction(hiloSeleccionado.id);
        if (hiloActualizado) {
          setHiloSeleccionado(hiloActualizado);
        }
        await cargarHilos();
      }
    } catch (error) {
      console.error("Error cerrando hilo:", error);
    } finally {
      setEnviando(false);
    }
  }

  async function handleReabrirHilo() {
    if (!hiloSeleccionado) return;

    try {
      setEnviando(true);
      const result = await reabrirHiloAdminAction(hiloSeleccionado.id);
      if (result.success) {
        const hiloActualizado = await getHiloDetalleAdminAction(hiloSeleccionado.id);
        if (hiloActualizado) {
          setHiloSeleccionado(hiloActualizado);
        }
        await cargarHilos();
      }
    } catch (error) {
      console.error("Error reabriendo hilo:", error);
    } finally {
      setEnviando(false);
    }
  }

  function handleVolver() {
    setVista("lista");
    setHiloSeleccionado(null);
  }

  if (vista === "detalle" && hiloSeleccionado) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col">
        <ConversacionView
          hilo={hiloSeleccionado}
          onBack={handleVolver}
          onEnviarRespuesta={handleEnviarRespuesta}
          onCerrarHilo={handleCerrarHilo}
          onReabrirHilo={handleReabrirHilo}
          esAdmin={true}
          enviando={enviando}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-brand-bg/30">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-brand-text">
            Gestión de Hilos
          </h1>
          <p className="text-sm text-brand-accent mt-1">
            Administra las consultas de los usuarios
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-white border border-brand-accent/15">
            <p className="text-2xl font-bold text-brand-text">{stats.total}</p>
            <p className="text-xs text-brand-accent">Total</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-primary/5 border border-brand-primary/20">
            <p className="text-2xl font-bold text-brand-primary">{stats.abiertos}</p>
            <p className="text-xs text-brand-accent">Abiertos</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-accent/5 border border-brand-accent/20">
            <p className="text-2xl font-bold text-brand-accent">{stats.cerrados}</p>
            <p className="text-xs text-brand-accent">Cerrados</p>
          </div>
          <div className="p-3 rounded-xl bg-brand-secondary/5 border border-brand-secondary/20">
            <p className="text-2xl font-bold text-brand-secondary">{stats.no_leidos}</p>
            <p className="text-xs text-brand-accent">Sin leer</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[
            { label: "Todos", value: undefined },
            { label: "Abiertos", value: "abierto" as EstadoHilo },
            { label: "Cerrados", value: "cerrado" as EstadoHilo },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setFiltroEstado(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filtroEstado === tab.value
                  ? "bg-brand-primary text-white"
                  : "bg-white text-brand-accent hover:text-brand-text border border-brand-accent/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
          </div>
        ) : hilos.data.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-brand-accent/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-brand-text mb-1">
              No hay hilos
            </h3>
            <p className="text-sm text-brand-accent">
              Los hilos de los usuarios aparecerán aquí
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {hilos.data.map((hilo) => (
              <HiloCard
                key={hilo.id}
                hilo={hilo}
                onClick={handleHiloClick}
                showUsuario
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
