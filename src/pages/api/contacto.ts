import type { APIRoute } from "astro";
import { enviarContacto, esquemaContacto } from "../../lib/contacto";

// R2: la ruta lee el cuerpo, valida el esquema, llama a src/lib y responde.
// El motivo de un fallo va al registro desde src/lib, nunca al navegador.
export const prerender = false;

const ESTADO_POR_MOTIVO = {
  configuracion: 500,
  red: 502,
  rechazo: 502,
} as const;

function responder(ok: boolean, estado: number): Response {
  return new Response(JSON.stringify({ ok }), {
    status: estado,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request }) => {
  let formulario: FormData;
  try {
    formulario = await request.formData();
  } catch {
    return responder(false, 400);
  }

  const datos = esquemaContacto.safeParse(Object.fromEntries(formulario));
  if (!datos.success) return responder(false, 400);

  const resultado = await enviarContacto(datos.data);
  return resultado.ok
    ? responder(true, 200)
    : responder(false, ESTADO_POR_MOTIVO[resultado.motivo]);
};
