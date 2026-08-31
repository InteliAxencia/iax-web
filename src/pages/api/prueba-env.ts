import type { APIRoute } from "astro";
import { PRUEBA_SECRETO } from "astro:env/server";

// Ruta de comprobacion del bloque F. Renderizada bajo demanda para que el
// secreto se resuelva en el runtime y no en tiempo de compilacion.
// R2: la ruta es fina y no importa nada de cloudflare:*.
export const prerender = false;

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      secretoDefinido: PRUEBA_SECRETO !== undefined,
      longitud: PRUEBA_SECRETO?.length ?? 0,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
};
