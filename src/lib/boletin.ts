import { z } from "astro/zod";
import { EXPRESION_CORREO } from "./correo";

// Esquema del formulario del boletín. Lo usará la ruta de B8-4, junto con la
// doble confirmación; hasta entonces el envío del formulario es simulado.
export const esquemaBoletin = z.object({
  email: z.string().trim().max(254).regex(EXPRESION_CORREO),
  // La casilla no lleva value: marcada envía "on" y sin marcar no envía nada.
  consentimiento: z.literal("on"),
  // Campo trampa (docs/decisiones-reversibles.md, apartado 10): una persona
  // lo deja vacío y muchos bots lo rellenan.
  web: z.string().trim().optional(),
});

export type DatosBoletin = z.infer<typeof esquemaBoletin>;
