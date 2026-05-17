"use client";

import { useState, useEffect, useCallback } from "react";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import CardList from "@/components/profile/CardList";
import AddCardForm from "@/components/profile/AddCardForm";
import AddBalanceForm from "@/components/profile/AddBalanceForm";
import {
  getTarjetasAction,
  createTarjetaAction,
  deleteTarjetaAction,
  addBalanceAction,
} from "@/app/(with-navbar)/perfil/tarjetaActions";
import type { TarjetaListItem } from "@/services/tarjeta/tarjetaService";

// ─── Tipos internos ────────────────────────────────────────────────

type ModalView = "list" | "add" | "balance";

interface Notification {
  id: number;
  type: "success" | "error";
  message: string;
}

// ─── Modal titles ──────────────────────────────────────────────────

const VIEW_TITLES: Record<ModalView, string> = {
  list: "Gestión Financiera",
  add: "Agregar Tarjeta",
  balance: "Agregar Saldo",
};

// ─── Componente ────────────────────────────────────────────────────

interface FinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FinancialModal({ isOpen, onClose }: FinancialModalProps) {
  const [view, setView] = useState<ModalView>("list");
  const [tarjetas, setTarjetas] = useState<TarjetaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTarjeta, setSelectedTarjeta] = useState<TarjetaListItem | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  // ── Fetch tarjetas on open ──

  const fetchTarjetas = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getTarjetasAction();
      if (result.success && result.tarjetas) {
        setTarjetas(result.tarjetas);
      }
    } catch {
      showNotification("error", "Error al cargar tarjetas.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Reset state when modal opens
    setView("list");
    setSelectedTarjeta(null);
    setNotification(null);
    fetchTarjetas();
  }, [isOpen, fetchTarjetas]);

  // ── Notification helper ──

  function showNotification(type: "success" | "error", message: string) {
    setNotification({ id: Date.now(), type, message });
  }

  // ── Handlers ──

  async function handleCreateCard(data: {
    nombre_titular: string;
    numero_tarjeta: string;
    cvv: string;
    mes_caducidad: number;
    ano_caducidad: number;
    saldo: number;
  }) {
    const result = await createTarjetaAction(data);

    if (result.success) {
      showNotification("success", result.message ?? "Tarjeta registrada.");
      await fetchTarjetas();
      // Delay navigation so user sees the success state on the form
      setTimeout(() => setView("list"), 1200);
    } else if (result.errors?.form) {
      showNotification("error", result.errors.form);
    }

    return { success: result.success, errors: result.errors };
  }

  async function handleDeleteCard(tarjetaId: number) {
    const result = await deleteTarjetaAction(tarjetaId);

    if (result.success) {
      showNotification("success", result.message ?? "Tarjeta eliminada.");
      setTarjetas((prev) => prev.filter((t) => t.id !== tarjetaId));
    } else {
      showNotification("error", result.errors?.form ?? "Error al eliminar.");
    }
  }

  async function handleAddBalance(tarjetaId: number, amount: number) {
    const result = await addBalanceAction(tarjetaId, amount);

    if (result.success) {
      showNotification("success", result.message ?? "Saldo añadido.");
      await fetchTarjetas();
      setTimeout(() => setView("list"), 1200);
    } else if (result.errors?.form) {
      showNotification("error", result.errors.form);
    }

    return { success: result.success, errors: result.errors };
  }

  function handleOpenAddBalance(tarjeta: TarjetaListItem) {
    setSelectedTarjeta(tarjeta);
    setView("balance");
  }

  function handleBack() {
    setView("list");
    setSelectedTarjeta(null);
  }

  // ── Render view ──

  function renderView() {
    switch (view) {
      case "list":
        return (
          <CardList
            tarjetas={tarjetas}
            isLoading={isLoading}
            onAddCard={() => setView("add")}
            onAddBalance={handleOpenAddBalance}
            onDelete={handleDeleteCard}
          />
        );
      case "add":
        return (
          <AddCardForm
            onSubmit={handleCreateCard}
            onBack={handleBack}
          />
        );
      case "balance":
        return selectedTarjeta ? (
          <AddBalanceForm
            tarjeta={selectedTarjeta}
            onSubmit={handleAddBalance}
            onBack={handleBack}
          />
        ) : null;
      default:
        return null;
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={VIEW_TITLES[view]}
        maxWidth="md"
      >
        {renderView()}
      </Modal>

      {notification && (
        <Alert
          key={`financial-${notification.id}`}
          variant={notification.type}
          onClose={() => setNotification(null)}
        >
          {notification.message}
        </Alert>
      )}
    </>
  );
}
