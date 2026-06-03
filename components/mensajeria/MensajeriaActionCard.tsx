"use client";

import ActionCard from "@/components/ActionCard";
import MensajeriaBadge from "@/components/mensajeria/MensajeriaBadge";
import { MessageSquare } from "lucide-react";

export default function MensajeriaActionCard() {
  return (
    <ActionCard
      href="/panel-admin/mensajeria"
      title="Mensajería"
      description="Comunícate en tiempo real con clientes y administradores."
      category="Comunicación"
      icon={MessageSquare}
      delayClass="delay-[600ms]"
      badge={<MensajeriaBadge size="sm" />}
    />
  );
}
