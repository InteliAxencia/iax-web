import type { APIRoute } from "astro";
import { confirmar, esquemaConfirmacion } from "../../../lib/boletin";

// R2: la ruta lee el cuerpo, valida el esquema, llama a src/lib y responde.
// Responde con una redirección 303 a una página estática: quien confirma
// llega desde el navegador por un formulario, y necesita una página legible,
// no JSON. El motivo de un fallo va al registro desde src/lib.
export const prerender = false;

const DESTINO = {
  confirmado: "/boletin/confirmado",
  enlace: "/boletin/enlace-no-valido",
  error: "/boletin/error",
} as const;

// Tope del cuerpo de la petición: el token cabe en 512 caracteres.
const TAMANO_MAXIMO_BYTES = 4 * 1024;

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const longitud = Number(request.headers.get("Content-Length"));
  if (longitud > TAMANO_MAXIMO_BYTES) return redirect(DESTINO.enlace, 303);

  let formulario: FormData;
  try {
    formulario = await request.formData();
  } catch {
    return redirect(DESTINO.enlace, 303);
  }

  const datos = esquemaConfirmacion.safeParse(Object.fromEntries(formulario));
  if (!datos.success) return redirect(DESTINO.enlace, 303);

  const resultado = await confirmar(datos.data.t, clientAddress);
  if (resultado.ok) return redirect(DESTINO.confirmado, 303);
  return redirect(
    resultado.motivo === "enlace" ? DESTINO.enlace : DESTINO.error,
    303,
  );
};
