import { z } from "astro/zod";
import {
  CLAVE_ENLACE_BOLETIN,
  CORREO_REMITENTE,
  MAILJET_LISTA_BOLETIN,
} from "astro:env/server";
import { EXPRESION_CORREO } from "./correo";
import { cifrarEnlace, descifrarEnlace, importarClave } from "./enlace";
import { altaEnLista, enviarCorreo, type Resultado } from "./mailjet";

// Esquema del formulario del boletín, que recibe POST /api/boletin.
export const esquemaBoletin = z.object({
  email: z.string().trim().max(254).regex(EXPRESION_CORREO),
  // La casilla no lleva value: marcada envía "on" y sin marcar no envía nada.
  consentimiento: z.literal("on"),
  // Campo trampa (docs/decisiones-reversibles.md, apartado 10): una persona
  // lo deja vacío y muchos bots lo rellenan.
  web: z.string().trim().optional(),
});

export type DatosBoletin = z.infer<typeof esquemaBoletin>;

export const esquemaConfirmacion = z.object({
  // Token del enlace, que la página de confirmación copia del fragmento.
  t: z.string().min(1).max(512),
});

export type ResultadoConfirmacion = Resultado | { ok: false; motivo: "enlace" };

const CADUCIDAD_MS = 7 * 24 * 60 * 60 * 1000;

// Lista y clave se comprueban antes de llamar a Mailjet, también al
// suscribir: sin ellas se enviaría un correo que no se puede confirmar.
async function configuracion(): Promise<{
  lista: number;
  clave: CryptoKey;
} | null> {
  if (!MAILJET_LISTA_BOLETIN || !CLAVE_ENLACE_BOLETIN) return null;
  const clave = await importarClave(CLAVE_ENLACE_BOLETIN);
  return clave ? { lista: MAILJET_LISTA_BOLETIN, clave } : null;
}

function sinConfiguracion(): Resultado {
  const resultado = { ok: false, motivo: "configuracion" } as const;
  console.error(JSON.stringify({ origen: "boletin", ...resultado }));
  return resultado;
}

function textoConfirmacion(enlace: string): string {
  return [
    "Hola:",
    "",
    "Has pedido recibir una vez al mes novedades de IA relevantes para el ámbito laboral, casos prácticos y herramientas explicadas en claro. Sin spam.",
    "",
    "Para confirmar la suscripción, abre este enlace y pulsa «Confirmar suscripción»:",
    enlace,
    "",
    "El enlace caduca en 7 días. Si no confirmas, no te daremos de alta.",
    "",
    "Si no has pedido esta suscripción, ignora este correo.",
    "",
    "inteliAxencia",
    "https://inteliaxencia.com",
  ].join("\n");
}

// El enlace usa el origen de la petición, así apunta al mismo sitio en
// desarrollo y en producción. Si el campo trampa llega relleno, se responde
// como enviado para no delatar la comprobación, y el registro no lleva datos
// del formulario.
export async function suscribir(
  datos: DatosBoletin,
  origen: string,
): Promise<Resultado> {
  if (datos.web) {
    console.warn(JSON.stringify({ origen: "boletin", motivo: "trampa" }));
    return { ok: true };
  }

  const config = await configuracion();
  if (!config) return sinConfiguracion();

  const token = await cifrarEnlace(
    { correo: datos.email, caduca: Date.now() + CADUCIDAD_MS },
    config.clave,
  );
  return enviarCorreo({
    remitente: { correo: CORREO_REMITENTE, nombre: "inteliAxencia" },
    destinatario: { correo: datos.email },
    asunto: "Confirma tu suscripción a noticiAx",
    texto: textoConfirmacion(`${origen}/boletin/confirmar#t=${token}`),
  });
}

// La IP y la fecha son las del momento en que la persona pulsa el botón de
// confirmar, y quedan en Mailjet como prueba del consentimiento.
export async function confirmar(
  token: string,
  ip: string,
): Promise<ResultadoConfirmacion> {
  const config = await configuracion();
  if (!config) return sinConfiguracion();

  const datos = await descifrarEnlace(token, config.clave, Date.now());
  if (!datos) {
    console.warn(JSON.stringify({ origen: "boletin", motivo: "enlace" }));
    return { ok: false, motivo: "enlace" };
  }

  return altaEnLista(config.lista, datos.correo, {
    ip_confirmacion: ip,
    fecha_confirmacion: new Date().toISOString(),
  });
}
