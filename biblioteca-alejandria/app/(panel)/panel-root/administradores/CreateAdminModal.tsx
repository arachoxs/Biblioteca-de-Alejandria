"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import { Plus, Loader2 } from "lucide-react";
import { createAdmin } from "./action";
import type { RegisterResponse } from "@/lib/types/auth";

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAdminModal({ isOpen, onClose, onSuccess }: CreateAdminModalProps) {
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [alertState, setAlertState] = useState<RegisterResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    // Limpiar el estado al cerrar
    setNewAdminEmail("");
    setErrors({});
    setAlertState(null);
    onClose();
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setAlertState(null);
    setErrors({});

    try {
      const response: RegisterResponse = await createAdmin(newAdminEmail);

      if (response.success) {
        setNewAdminEmail("");
        setAlertState(response);
        
        // Esperar un momento para mostrar el mensaje de éxito antes de cerrar
        setTimeout(() => {
          handleClose();
          onSuccess(); // Notificar al padre para que recargue la lista
        }, 1500);
      } else {
        setErrors(response.errors || {});
        setAlertState(response);
      }
    } catch (error: unknown) {
      const errorResponse: RegisterResponse = {
        success: false,
        message: "Ocurrió un error inesperado al crear el administrador.",
      };
      setAlertState(errorResponse);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo Administrador"
    >
      <form onSubmit={handleCreateAdmin} className="space-y-6">
        {alertState && (
          <Alert variant={alertState.success ? "success" : "error"}>
            {alertState.message}
          </Alert>
        )}

        <p className="text-sm text-brand-secondary/80 leading-relaxed">
          Ingresa el correo electrónico del usuario para invitarlo como administrador.
          Se le enviará un email con sus credenciales de acceso.
        </p>

        <Input
          id="admin-email"
          label="Correo Electrónico"
          type="email"
          placeholder="ejemplo@biblioteca.com"
          value={newAdminEmail}
          onChange={(e) => setNewAdminEmail(e.target.value)}
          required
          error={errors.correo}
          disabled={isCreating}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            className="w-auto px-4 py-1 text-sm"
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isCreating}
            className="w-auto px-6 !py-1 text-sm flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creando...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Crear Administrador
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
