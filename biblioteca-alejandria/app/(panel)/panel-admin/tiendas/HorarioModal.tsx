import type { TiendaWithDireccion } from "@/lib/types/tienda";
import Modal from "@/components/ui/Modal";
import Table from "@/components/ui/Table";
import type { Column } from "@/components/ui/Table";

interface horarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  tienda: TiendaWithDireccion | null;
}

interface FranjaHoraria {
  apertura: string;
  cierre: string;
}

// Representa una fila procesada para la tabla
interface HorarioFila extends FranjaHoraria {
  dia: string;
}

export default function HorarioModal({
  isOpen,
  onClose,
  tienda,
}: horarioModalProps) {
  const columns: Column<HorarioFila>[] = [
    {
      header: "Día",
      render: (item) => <span className="capitalize">{item.dia}</span>,
    },
    {
      header: "Apertura",
      render: (item) => <span>{item.apertura}</span>,
    },
    {
      header: "Cierre",
      render: (item) => <span>{item.cierre}</span>,
    },
  ];

  if (!tienda) return null;

  const dataHorario: HorarioFila[] = Object.entries(tienda.horario)
    .map(([dia, tiempos]) => ({
      dia,
      ...tiempos,
    }))
    .filter((val: HorarioFila) => val.apertura && val.cierre); // Filtrar días sin horario;

  return (
    <Modal
      title={`Horario de ${tienda?.nombre || "la tienda"}`}
      isOpen={isOpen}
      onClose={onClose}>
      <Table columns={columns} data={dataHorario} />
    </Modal>
  );
}
