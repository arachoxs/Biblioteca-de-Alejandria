"use client";

import { useState, useEffect } from "react";
import BackLink from "@/components/ui/BackLink";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { Settings, Save, Loader2 } from "lucide-react";
import { getConfigsAction, updateConfigAction } from "./action";
import type { ConfigRow } from "@/lib/types/config";

const LABELS: Record<string, string> = {
  promocion_cumpleanos_porcentaje: "Porcentaje de descuento — Cumpleaños",
};

export default function ConfiguracionContent() {
  const [configs, setConfigs] = useState<ConfigRow[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await getConfigsAction();
        if (res.success && res.data) {
          setConfigs(res.data);
          const initial: Record<string, number> = {};
          for (const c of res.data) {
            initial[c.clave] =
              typeof c.valor === "string" ? parseInt(c.valor, 10) : Number(c.valor);
          }
          setEditedValues(initial);
        } else {
          setError(res.errors?.form ?? "Error al cargar configuración.");
        }
      } catch {
        setError("Error inesperado.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (clave: string, value: string) => {
    const num = parseInt(value, 10);
    setEditedValues((prev) => ({ ...prev, [clave]: isNaN(num) ? 0 : num }));
    setSuccess(null);
  };

  const handleSave = async (clave: string) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await updateConfigAction(clave, editedValues[clave]);
      if (res.success) {
        setSuccess(res.message ?? "Configuración actualizada.");
        setConfigs((prev) =>
          prev.map((c) =>
            c.clave === clave ? { ...c, valor: editedValues[clave] } : c,
          ),
        );
      } else {
        setError(res.errors?.valor ?? res.errors?.form ?? res.message ?? "Error al guardar.");
      }
    } catch {
      setError("Error inesperado al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center px-6 py-12 md:px-10 lg:py-16">
      <div className="w-full max-w-2xl">
        <BackLink href="/panel-root" label="Volver al panel" />

        <header className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-primary rounded-xl mb-5 shadow-lg shadow-brand-primary/20">
            <Settings className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-primary tracking-tight mb-3">
            Configuración
          </h1>
          <p className="text-brand-secondary text-sm">
            Variables y reglas del sistema.
          </p>
          <div className="w-12 h-0.5 bg-brand-accent mt-4 rounded-full" />
        </header>

        {error && (
          <div className="mb-6">
            <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mb-6">
            <Alert variant="success" onClose={() => setSuccess(null)}>{success}</Alert>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-accent" />
          </div>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <div
                key={config.clave}
                className="bg-white rounded-xl border border-brand-accent/20 p-6 shadow-sm"
              >
                <label className="block text-sm font-semibold text-brand-primary mb-1">
                  {LABELS[config.clave] ?? config.clave}
                </label>
                {config.descripcion && (
                  <p className="text-xs text-brand-secondary mb-3">
                    {config.descripcion}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editedValues[config.clave] ?? ""}
                    onChange={(e) => handleChange(config.clave, e.target.value)}
                    className="w-24 px-3 py-2 border border-brand-accent/30 rounded-lg text-brand-text text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                  />
                  <span className="text-sm text-brand-secondary">%</span>
                  <Button
                    onClick={() => handleSave(config.clave)}
                    disabled={isSaving}
                    className="ml-auto flex items-center gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Guardar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
