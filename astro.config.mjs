// @ts-check
import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  output: "static",
  // R1: el adaptador activa por defecto Cloudflare Images y sesiones sobre
  // Workers KV, los dos prohibidos. imageService compile optimiza en tiempo
  // de compilacion sin el binding de Images. session false deja fuera del
  // paquete el runtime de sesiones y evita el binding de KV.
  adapter: cloudflare({
    imageService: "compile",
  }),

  session: false,

  // Las variables de servidor con datos sensibles van con access "secret"
  // para que no puedan acabar en el bundle del cliente. Sus valores se cargan
  // con wrangler secret put, y en local desde .dev.vars.
  // ID_FISCAL va con access "public" porque se imprime en el aviso legal. Su
  // valor real solo se aporta en la compilacion de Cloudflare, para que no
  // entre en el historial publico. El marcador por defecto mantiene dev y
  // build en marcha; que no llegue a produccion lo comprueba verify.
  env: {
    schema: {
      ID_FISCAL: envField.string({
        context: "server",
        access: "public",
        optional: true,
        default: "XXXXXXXXX",
      }),
      PRUEBA_SECRETO: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
