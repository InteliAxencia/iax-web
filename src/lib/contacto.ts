import { z } from "astro/zod";
import { CORREO_DESTINO_CONTACTO, CORREO_REMITENTE } from "astro:env/server";
import { enviarCorreo, type Resultado } from "./mailjet";

export const esquemaContacto = z.object({
  nombre: z.string().trim().min(1).max(200),
  email: z.string().trim().max(254).pipe(z.email()),
  telefono: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+().\s-]*$/)
    .optional(),
  mensaje: z.string().trim().min(1).max(5000),
});

export type DatosContacto = z.infer<typeof esquemaContacto>;

// Sin saltos de línea ni caracteres de control: el nombre va en el asunto y
// en ReplyTo, que son cabeceras del correo.
function enLinea(texto: string): string {
  return texto.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

export function enviarContacto(
  datos: DatosContacto,
  opciones: { prueba?: boolean } = {},
): Promise<Resultado> {
  const nombre = enLinea(datos.nombre);
  const texto = [
    `Nombre: ${nombre}`,
    `Correo: ${datos.email}`,
    `Teléfono: ${datos.telefono || "no indicado"}`,
    "",
    "Mensaje:",
    datos.mensaje,
  ].join("\n");

  return enviarCorreo(
    {
      remitente: { correo: CORREO_REMITENTE, nombre: "Web inteliAxencia" },
      destinatario: { correo: CORREO_DESTINO_CONTACTO },
      responderA: { correo: datos.email, nombre },
      asunto: `Contacto web: ${nombre}`,
      texto,
    },
    opciones,
  );
}
