TRUNCATE TABLE "public"."reserva";

ALTER TABLE "public"."reserva" DROP CONSTRAINT "Reserva_id_libro_fkey";
ALTER TABLE "public"."reserva" DROP COLUMN "id_libro";
ALTER TABLE "public"."reserva" DROP COLUMN "cantidad";

ALTER TABLE "public"."reserva" ADD COLUMN "id_copia" uuid NOT NULL;
ALTER TABLE "public"."reserva" ADD CONSTRAINT "reserva_id_copia_fkey" FOREIGN KEY ("id_copia") REFERENCES "public"."copia"("id") ON DELETE NO ACTION;

ALTER TABLE "public"."reserva" ADD COLUMN "fecha_expiracion" timestamp with time zone NOT NULL DEFAULT (now() + interval '1 day');
