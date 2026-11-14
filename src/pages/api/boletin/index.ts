import type { APIRoute } from "astro";
import { esquemaBoletin, suscribir } from "../../../lib/boletin";

// R2: la ruta lee el cuerpo, valida el esquema, llama a src/lib y responde.
// El motivo de un fallo va al registro desde src/lib, nunca al navegador.
export const prerender = false;

const ESTADO_POR_MOTIVO = {
  configuracion: 500,
  red: 502,
  rechazo: 502,
} as const;

// Tope del cuerpo de la petición: cubre un correo de 254 caracteres no ASCII
// enviado sin JavaScript, de hasta 9 bytes cada uno, más la casilla y el
// campo trampa.
const TAMANO_MAXIMO_BYTES = 8 * 1024;

function responder(ok: boolean, estado: number): Response {
  return new Response(JSON.stringify({ ok }), {
    status: estado,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, site, url }) => {
  const longitud = Number(request.headers.get("Content-Length"));
  if (longitud > TAMANO_MAXIMO_BYTES) return responder(false, 413);

  let formulario: FormData;
  try {
    formulario = await request.formData();
  } catch {
    return responder(false, 400);
  }

  const datos = esquemaBoletin.safeParse(Object.fromEntries(formulario));
  if (!datos.success) return responder(false, 400);

  // Fuera de desarrollo, el enlace del correo lleva el origen de site
  // (astro.config.mjs), no el de la petición, que puede llegar por otro host,
  // como workers.dev. En desarrollo, o si site no está definido, lleva el de la
  // petición.
  const origen = import.meta.env.DEV || !site ? url.origin : site.origin;
  const resultado = await suscribir(datos.data, origen);
  return resultado.ok
    ? responder(true, 200)
    : responder(false, ESTADO_POR_MOTIVO[resultado.motivo]);
};
