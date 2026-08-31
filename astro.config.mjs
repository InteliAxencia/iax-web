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

  // Las variables de servidor van con access "secret" para que no puedan
  // acabar en el bundle del cliente. Los valores reales se cargan con
  // wrangler secret put, y en local desde .dev.vars.
  env: {
    schema: {
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
