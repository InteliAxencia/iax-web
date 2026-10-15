import { MAILJET_API_KEY, MAILJET_SECRET_KEY } from "astro:env/server";

const API = "https://api.mailjet.com";
const TIEMPO_MAXIMO_MS = 10_000;

export interface Direccion {
  correo: string;
  nombre?: string;
}

export interface Mensaje {
  remitente: Direccion;
  destinatario: Direccion;
  responderA?: Direccion;
  asunto: string;
  texto: string;
}

export type Resultado =
  | { ok: true }
  | {
      ok: false;
      motivo: "configuracion" | "red" | "rechazo";
      estado?: number;
      codigos?: string[];
    };

// Las claves son opcionales en el esquema (ver astro.config.mjs). Si falta
// alguna, no se llama a Mailjet.
function autorizacion(): string | null {
  if (!MAILJET_API_KEY || !MAILJET_SECRET_KEY) return null;
  return "Basic " + btoa(`${MAILJET_API_KEY}:${MAILJET_SECRET_KEY}`);
}

function direccion(d: Direccion) {
  return d.nombre ? { Email: d.correo, Name: d.nombre } : { Email: d.correo };
}

// Solo códigos y nombres de campo de la respuesta de error, nunca su texto,
// que podría repetir datos del mensaje.
function codigosDeError(cuerpo: unknown): string[] {
  if (typeof cuerpo !== "object" || cuerpo === null) return [];
  const mensajes = (
    cuerpo as {
      Messages?: {
        Errors?: { ErrorCode?: string; ErrorRelatedTo?: string[] }[];
      }[];
    }
  ).Messages;
  return (mensajes ?? []).flatMap((m) =>
    (m.Errors ?? []).map((e) =>
      [e.ErrorCode, ...(e.ErrorRelatedTo ?? [])].filter(Boolean).join(" "),
    ),
  );
}

function fallo(resultado: Exclude<Resultado, { ok: true }>): Resultado {
  console.error(JSON.stringify({ origen: "mailjet", ...resultado }));
  return resultado;
}

async function llamar(ruta: string, cuerpo: unknown): Promise<Resultado> {
  const cabecera = autorizacion();
  if (!cabecera) return fallo({ ok: false, motivo: "configuracion" });

  let respuesta: Response;
  try {
    respuesta = await fetch(API + ruta, {
      method: "POST",
      headers: { Authorization: cabecera, "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
  } catch {
    return fallo({ ok: false, motivo: "red" });
  }

  if (!respuesta.ok) {
    const cuerpoError: unknown = await respuesta.json().catch(() => null);
    return fallo({
      ok: false,
      motivo: "rechazo",
      estado: respuesta.status,
      codigos: codigosDeError(cuerpoError),
    });
  }

  // La respuesta correcta no se lee: MessageID puede perder precisión con
  // JSON.parse y aquí no se necesita.
  await respuesta.body?.cancel();
  return { ok: true };
}

// Seguimiento de aperturas y clics desactivado en cada envío, además de en la
// cuenta (docs/decisiones-reversibles.md, apartado 7). prueba activa
// SandboxMode: Mailjet valida la petición sin entregar el correo.
export function enviarCorreo(
  mensaje: Mensaje,
  opciones: { prueba?: boolean } = {},
): Promise<Resultado> {
  return llamar("/v3.1/send", {
    SandboxMode: opciones.prueba ?? false,
    Messages: [
      {
        From: direccion(mensaje.remitente),
        To: [direccion(mensaje.destinatario)],
        ...(mensaje.responderA
          ? { ReplyTo: direccion(mensaje.responderA) }
          : {}),
        Subject: mensaje.asunto,
        TextPart: mensaje.texto,
        TrackOpens: "disabled",
        TrackClicks: "disabled",
      },
    ],
  });
}

export function anadirALista(
  correo: string,
  lista: number,
): Promise<Resultado> {
  return llamar("/v3/REST/listrecipient", {
    ContactAlt: correo,
    ListID: lista,
    IsUnsubscribed: false,
  });
}
