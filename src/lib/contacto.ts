import { z } from "astro/zod";
import { CORREO_DESTINO_CONTACTO, CORREO_REMITENTE } from "astro:env/server";
import { enviarCorreo, type Resultado } from "./mailjet";

export const esquemaContacto = z
  .object({
    nombre: z.string().trim().min(1).max(200),
    email: z.string().trim().max(254).pipe(z.email()),
    // Prefijo y teléfono van en cajas separadas. El prefijo es obligatorio si
    // hay teléfono y se guarda siempre con +. Los espacios del teléfono se
    // quitan sin avisar.
    prefijo: z
      .string()
      .trim()
      .regex(/^(\+?\d{1,3})?$/)
      .transform((v) => (v && !v.startsWith("+") ? "+" + v : v))
      .optional(),
    telefono: z
      .string()
      .max(30)
      .transform((v) => v.replace(/ /g, ""))
      .pipe(z.string().regex(/^(\d{8,15})?$/))
      .optional(),
    mensaje: z.string().trim().min(1).max(5000),
    // Campo trampa (docs/decisiones-reversibles.md, apartado 10): una persona
    // lo deja vacío y muchos bots lo rellenan.
    web: z.string().trim().optional(),
  })
  .refine((d) => !d.telefono || Boolean(d.prefijo), { path: ["prefijo"] });

export type DatosContacto = z.infer<typeof esquemaContacto>;

// Sin saltos de línea ni caracteres de control: el nombre va en el asunto y
// en ReplyTo, que son cabeceras del correo.
function enLinea(texto: string): string {
  return texto.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

export function enviarContacto(datos: DatosContacto): Promise<Resultado> {
  // Se responde como si se hubiera enviado, para no delatar la comprobación.
  // El registro no lleva datos del formulario.
  if (datos.web) {
    console.warn(JSON.stringify({ origen: "contacto", motivo: "trampa" }));
    return Promise.resolve({ ok: true });
  }

  const nombre = enLinea(datos.nombre);
  const telefono = datos.telefono
    ? `${datos.prefijo} ${datos.telefono}`
    : "no indicado";
  const texto = [
    `Nombre: ${nombre}`,
    `Correo: ${datos.email}`,
    `Teléfono: ${telefono}`,
    "",
    "Mensaje:",
    datos.mensaje,
  ].join("\n");

  return enviarCorreo({
    remitente: { correo: CORREO_REMITENTE, nombre: "Web inteliAxencia" },
    destinatario: { correo: CORREO_DESTINO_CONTACTO },
    responderA: { correo: datos.email, nombre },
    asunto: `Contacto web: ${nombre}`,
    texto,
  });
}
