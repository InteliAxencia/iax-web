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
      // Las claves de Mailjet son opcionales aunque las rutas de API las
      // necesitan. astro:env/server evalua todos los secretos al cargarse, y
      // las paginas legales lo cargan para ID_FISCAL al prerenderizar, cuando
      // los secretos del Worker no existen. Si fueran obligatorias, el build
      // fallaria. Que esten definidas lo comprueba src/lib antes de llamar a
      // Mailjet.
      MAILJET_API_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      MAILJET_SECRET_KEY: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
      // Remitente y destino del formulario de contacto. Son publicas: la
      // direccion ya aparece en el sitio. Como ID_FISCAL, se fijan al compilar.
      // El remitente tiene que estar validado en Mailjet; el destino se puede
      // cambiar a otra direccion del equipo para probar.
      CORREO_REMITENTE: envField.string({
        context: "server",
        access: "public",
        default: "info@inteliaxencia.com",
      }),
      CORREO_DESTINO_CONTACTO: envField.string({
        context: "server",
        access: "public",
        default: "info@inteliaxencia.com",
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
