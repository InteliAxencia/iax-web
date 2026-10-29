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

// Solo identificadores y códigos de la respuesta de error, nunca ErrorMessage,
// que podría repetir datos del mensaje. Hay dos formas: los errores de cada
// mensaje de la Send API, en Messages[].Errors, y los globales o de la API
// REST, con ErrorIdentifier, ErrorCode o ErrorInfo en el nivel superior.
function codigosDeError(cuerpo: unknown): string[] {
  if (typeof cuerpo !== "object" || cuerpo === null) return [];
  const { ErrorIdentifier, ErrorCode, ErrorInfo, Messages } = cuerpo as {
    ErrorIdentifier?: unknown;
    ErrorCode?: unknown;
    ErrorInfo?: unknown;
    Messages?: {
      Errors?: {
        ErrorIdentifier?: string;
        ErrorCode?: string;
        ErrorRelatedTo?: string[];
      }[];
    }[];
  };

  const global = [ErrorIdentifier, ErrorCode, ErrorInfo]
    .filter((c): c is string => typeof c === "string" && c !== "")
    .join(" ");

  const porMensaje = (Messages ?? []).flatMap((m) =>
    (m.Errors ?? []).map((e) =>
      [e.ErrorIdentifier, e.ErrorCode, ...(e.ErrorRelatedTo ?? [])]
        .filter(Boolean)
        .join(" "),
    ),
  );

  return global ? [global, ...porMensaje] : porMensaje;
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
// cuenta (docs/decisiones-reversibles.md, apartado 7).
export function enviarCorreo(mensaje: Mensaje): Promise<Resultado> {
  return llamar("/v3.1/send", {
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

// Alta en la lista con addforce. Comprobado contra Mailjet el 29 de octubre de
// 2026: añade el contacto a la lista, no da error si ya estaba suscrito (doble
// clic en el botón) y reactiva a quien se había dado de baja. Las propiedades
// se sobrescriben en cada alta, así que la prueba guardada es la de la última
// confirmación. Tienen que existir antes en la cuenta: ip_confirmacion (texto)
// y fecha_confirmacion (fecha y hora).
export function altaEnLista(
  lista: number,
  correo: string,
  propiedades: Record<string, string>,
): Promise<Resultado> {
  return llamar(`/v3/REST/contactslist/${lista}/managecontact`, {
    Email: correo,
    Action: "addforce",
    Properties: propiedades,
  });
}
