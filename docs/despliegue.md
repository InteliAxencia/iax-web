# Despliegue

El proyecto todavía no está creado en Cloudflare. Este documento recoge lo que
hay que configurar el día que se cree, y lo que no puede olvidarse porque no
tiene otra comprobación que lo detecte.

## Variables de compilación

El sitio se prerenderiza entero, así que estas variables se leen en tiempo de
compilación. Van en las variables de **compilación** del proyecto, no en las de
ejecución del Worker: una variable de ejecución no llega al build y la página
saldría con el valor por defecto.

| Variable    | Contenido                                                                           | Si falta                                         |
| ----------- | ----------------------------------------------------------------------------------- | ------------------------------------------------ |
| `ID_FISCAL` | NIF del titular del sitio, que el aviso legal publica por el artículo 10 de la LSSI | La página se publica con el marcador `XXXXXXXXX` |

El valor real no está en el repositorio a propósito. Es público en la web, pero
el historial de un repositorio público no se puede reescribir, así que el dato
seguiría ahí cuando la sociedad sustituya a la persona física en el aviso legal.

## Variables de ejecución

Las leen las rutas de API al ejecutarse en el Worker, no durante el build. Se
cargan como secretos del Worker, con `npx wrangler secret put` seguido del
nombre o desde el panel como variable de tipo secreto, y no en las variables de
compilación. Los valores están en el gestor de contraseñas del equipo.

| Variable             | Contenido                          | Si falta                                                   |
| -------------------- | ---------------------------------- | ---------------------------------------------------------- |
| `MAILJET_API_KEY`    | Clave de la API de Mailjet         | El envío se detiene con un error antes de llamar a Mailjet |
| `MAILJET_SECRET_KEY` | Clave secreta de la API de Mailjet | Igual que la anterior                                      |

En el esquema de `astro:env` las dos son opcionales a propósito, aunque el envío
las necesita. El porqué está comentado en `astro.config.mjs`.

## Despliegue desde local

El build copia `.dev.vars` a `dist/server/`. Un `npx wrangler deploy` sin
opciones usa la configuración que genera el adaptador, redirigida desde
`.wrangler/deploy/`: sirve los assets de `dist/client` y sube como Worker solo
los `.mjs`, así que `.dev.vars` no viaja. Comprobado con `--dry-run` el 14 de
octubre de 2026, con `wrangler` 4.147.0.

No se despliega con `--config wrangler.json`. Esa configuración declara `./dist`
como carpeta de assets, y esa carpeta contiene `dist/server/.dev.vars`. Al
actualizar `wrangler` o el adaptador, se repite la comprobación con
`npx wrangler deploy --dry-run --outdir` hacia una carpeta temporal.

## Comprobación de marcadores, pendiente

Los textos legales llevan marcadores de equis en los datos que solo se conocen
el día de la publicación. Que ninguno llegue a producción no lo comprueba nadie
hoy.

La comprobación no puede vivir en el job `verify`: allí las variables de
compilación no existen, el build usa siempre el valor por defecto y el marcador
está siempre presente, así que fallaría en cada pull request.

Tiene que ejecutarse en el despliegue, después del build y con las variables ya
definidas. Al crear el proyecto:

1. Escribir `scripts/check-marcadores.mjs`, que recorra los `.html` de
   `dist/client/` y salga con error si encuentra una cadena de cuatro o más
   equis mayúsculas seguidas.
2. Configurar el comando de compilación del proyecto como
   `npm run build && node scripts/check-marcadores.mjs`, para que Cloudflare
   aborte el despliegue en lugar de publicar la página con el marcador.

Esto evita publicar un marcador. No evita publicar un dato mal escrito: el día
de la publicación hay que abrir las páginas legales y leerlas.

## Antes de publicar las páginas legales

Las políticas de privacidad y de cookies afirman cosas que solo se comprueban
con el proyecto creado y el sitio desplegado. Nada de esto lo detecta la CI.

1. Comprobar que la copia del contrato de encargo de Cloudflare está guardada
   fuera del repositorio. No hay aceptación expresa en el panel: el contrato
   forma parte del acuerdo de suscripción de autoservicio y queda aceptado con
   el alta de la cuenta. Confirmar que el correo corporativo ya está en
   Infomaniak y los contratos de encargo con Infomaniak y con Mailjet. La
   entidad de Mailjet y su dirección se contrastan con la política de
   privacidad. Si el panel de Mailjet no la muestra, se confirma con su soporte.
2. Comprobar el valor de _Challenge Passage_. Si no son los 30 minutos por
   defecto, se actualiza la duración de `cf_clearance` en la política de
   cookies.
3. Activar Cloudflare Web Analytics y comprobar en la pestaña de red que su
   script llega a la página. Si no llega, se instala a mano en `Base.astro`.
4. Desactivar en la cuenta de Mailjet el seguimiento de aperturas y de clics.
   La política de privacidad afirma que los envíos no los miden.
5. Recorrer el sitio desplegado en una ventana limpia, con las herramientas de
   desarrollo abiertas: la portada sin interactuar y después todas las páginas
   del menú. En Aplicación, anotar cookies y almacenamiento; en Red, los
   dominios desde los que se carga algo. La tabla de la política se ajusta a
   lo observado.
6. Confirmar que Cloudflare, Inc. sigue en la lista de
   https://www.dataprivacyframework.gov y que los enlaces a las políticas de
   terceros responden.

## Antes del primer envío de correo

SPF, DKIM y DMARC configurados en el dominio. Lo exige el bloqueo 4.1 de
`AGENTS.md` y no depende de este proyecto de Cloudflare.
