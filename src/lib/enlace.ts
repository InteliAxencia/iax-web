// Token del enlace de confirmación del boletín. Cifrado autenticado con
// AES-GCM de 256 bits: el correo no se lee en el enlace y cualquier cambio en
// el token hace fallar el descifrado. El sitio no guarda estado (R1): el token
// lleva el correo y su caducidad. Solo Web Crypto, sin cloudflare: (R2), así
// que funciona igual en Node y en Workers. Este archivo no lee astro:env: la
// clave llega ya importada.

const BYTES_IV = 12;
const BYTES_CLAVE = 32;
const BYTES_ETIQUETA = 16;

// Datos asociados: atan el token a este uso. Un texto cifrado con la misma
// clave para otro fin no se acepta como enlace del boletín.
const PROPOSITO = new TextEncoder().encode("iax-boletin-confirmacion-v1");

export interface DatosEnlace {
  correo: string;
  // Milisegundos desde el 1 de enero de 1970, UTC.
  caduca: number;
}

function aBase64Url(bytes: Uint8Array<ArrayBuffer>): string {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function deBase64Url(texto: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(texto)) return null;
  const base64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  try {
    return Uint8Array.from(atob(base64 + relleno), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
}

// null si la clave no son 32 bytes en base64: quien llama lo trata como
// configuración ausente.
export async function importarClave(base64: string): Promise<CryptoKey | null> {
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  if (bytes.length !== BYTES_CLAVE) return null;
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function cifrarEnlace(
  datos: DatosEnlace,
  clave: CryptoKey,
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(BYTES_IV));
  const claro = new TextEncoder().encode(
    JSON.stringify({ c: datos.correo, e: datos.caduca }),
  );
  const cifrado = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv, additionalData: PROPOSITO },
      clave,
      claro,
    ),
  );
  const token = new Uint8Array(BYTES_IV + cifrado.length);
  token.set(iv);
  token.set(cifrado, BYTES_IV);
  return aBase64Url(token);
}

// null si el token está mal formado, manipulado, cifrado con otra clave o
// caducado. Quien confirma no necesita distinguir entre esos casos: la página
// de resultado es la misma.
export async function descifrarEnlace(
  token: string,
  clave: CryptoKey,
  ahora: number,
): Promise<DatosEnlace | null> {
  const bytes = deBase64Url(token);
  if (!bytes || bytes.length <= BYTES_IV + BYTES_ETIQUETA) return null;

  let claro: ArrayBuffer;
  try {
    claro = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: bytes.slice(0, BYTES_IV),
        additionalData: PROPOSITO,
      },
      clave,
      bytes.slice(BYTES_IV),
    );
  } catch {
    return null;
  }

  let datos: unknown;
  try {
    datos = JSON.parse(new TextDecoder().decode(claro));
  } catch {
    return null;
  }
  const { c, e } = (datos ?? {}) as { c?: unknown; e?: unknown };
  if (typeof c !== "string" || typeof e !== "number") return null;
  if (ahora > e) return null;
  return { correo: c, caduca: e };
}
