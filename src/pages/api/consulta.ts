import type { APIRoute } from "astro";
import {
  enviarConsulta,
  esquemaConsulta,
  leerConsulta,
} from "../../lib/consulta";

// R2: la ruta lee el cuerpo, valida el esquema, llama a src/lib y responde.
// El motivo de un fallo va al registro desde src/lib, nunca al navegador.
export const prerender = false;

const ESTADO_POR_MOTIVO = {
  configuracion: 500,
  red: 502,
  rechazo: 502,
} as const;

// Tope del cuerpo de la petición, el mismo que en la ruta de contacto. Cubre
// el peor caso válido del esquema enviado sin JavaScript: unos 5800
// caracteres de texto libre, a 9 bytes cada uno. Una petición sin
// Content-Length no pasa por este control: la rechazan los límites del
// esquema.
const TAMANO_MAXIMO_BYTES = 64 * 1024;

function responder(ok: boolean, estado: number): Response {
  return new Response(JSON.stringify({ ok }), {
    status: estado,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  const longitud = Number(request.headers.get("Content-Length"));
  if (longitud > TAMANO_MAXIMO_BYTES) return responder(false, 413);

  let formulario: FormData;
  try {
    formulario = await request.formData();
  } catch {
    return responder(false, 400);
  }

  const datos = esquemaConsulta.safeParse(leerConsulta(formulario));
  if (!datos.success) return responder(false, 400);

  const resultado = await enviarConsulta(datos.data);
  return resultado.ok
    ? responder(true, 200)
    : responder(false, ESTADO_POR_MOTIVO[resultado.motivo]);
};
