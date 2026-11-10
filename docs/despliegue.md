# Despliegue

El proyecto se creó en Cloudflare el 6 de noviembre de 2026, con Workers Builds.
Este documento recoge cómo está configurado y lo que no puede olvidarse porque
no tiene otra comprobación que lo detecte.

## El proyecto en Cloudflare

Worker `iax-web`, conectado con Workers Builds al repositorio
`InteliAxencia/iax-web`, con `main` como rama de producción: cada push a `main`
compila y despliega. Hasta publicar en el dominio propio, se sirve en
`https://iax-web.inteliaxencia.workers.dev`.

El nombre del Worker tiene que coincidir con `name` en `wrangler.json`. Si no
coinciden, el build falla.

La app de GitHub «Cloudflare Workers and Pages» está instalada en la
organización inteliAxencia con acceso solo a este repositorio. Tiene permiso de
escritura sobre el código y los pull requests para abrir un pull request de
configuración cuando el repositorio no tiene `wrangler.json`; este lo tiene.

Configuración en **Settings › Builds**:

| Campo             | Valor                                                |
| ----------------- | ---------------------------------------------------- |
| Production branch | `main`                                               |
| Build command     | `npm run build && node scripts/check-marcadores.mjs` |
| Deploy command    | `npx wrangler deploy`                                |
| Root directory    | `/`                                                  |

Los Preview builds están desactivados. Con ellos, cada push a otra rama, también
las de Dependabot, se compilaría y se desplegaría como previsualización con
código que todavía no ha pasado la revisión.

### El token del despliegue

Workers Builds despliega con un token de usuario, `iax-web Workers Builds`, que
se creó al conectar el repositorio. Está en el perfil del usuario corporativo de
la cuenta de Cloudflare (**My Profile › API Tokens**), con el acceso restringido
al equipo que configura el despliegue. Workers Builds todavía no admite tokens
de cuenta.

En **Settings › Builds**, el apartado del token muestra «Configured API token
unavailable», pero el token funciona: lo usó el despliegue del 6 de noviembre.
Si el token se borra o se revoca, o el usuario corporativo pierde el acceso a la
cuenta, los despliegues fallan en la fase de despliegue. Se repone con
**Create new token** en ese mismo apartado, con la sesión iniciada como usuario
corporativo.

### workers.dev y URL de versión

`wrangler.json` declara `workers_dev: true` y `preview_urls: false`. Cada
`npx wrangler deploy` aplica lo que dice el archivo y pisa lo que se haya
cambiado en el panel, así que estos valores se cambian solo en el archivo.

- `workers_dev: true` mantiene la dirección de workers.dev, la única del sitio
  hasta publicar en el dominio propio. Pasa a `false` al publicar en
  inteliaxencia.com, en el ticket WEBIAX-82, y el paso está en «Antes de
  publicar el sitio»: por workers.dev no pasan los ajustes de la zona, como el
  bloqueo de rastreadores de entrenamiento de IA, y el sitio quedaría servido
  por dos direcciones.
- `preview_urls: false` evita que cada versión desplegada tenga su propia URL
  pública, que seguiría mostrando el contenido de esa versión después de
  sustituirla.

## Variables de compilación

El sitio se prerenderiza entero, así que estas variables se leen en tiempo de
compilación. Van en **Settings › Builds › Variables and secrets**, pestaña
**Production**, no en **Runtime variables and secrets**: una variable de
ejecución no llega al build y la página saldría con el valor por defecto. Las
tres son de tipo texto, porque son datos que el sitio publica.

Después de guardar, hay que comprobar que aparecen en la lista. El 6 de
noviembre no se guardaron al primer intento, y el build siguiente falló en la
comprobación de marcadores.

| Variable                  | Contenido                                                                                                                  | Si falta                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `ID_FISCAL`               | NIF del titular del sitio, que publican el aviso legal (artículo 10 de la LSSI) y las políticas de privacidad y de cookies | El despliegue se detiene en la comprobación de marcadores |
| `CORREO_REMITENTE`        | Remitente de los correos del formulario de contacto. Tiene que estar validado en Mailjet                                   | Se usa `info@inteliaxencia.com`                           |
| `CORREO_DESTINO_CONTACTO` | Dirección que recibe los mensajes del formulario de contacto                                                               | Se usa `info@inteliaxencia.com`                           |

El valor real de `ID_FISCAL` no está en el repositorio a propósito. Es público
en la web, pero el historial de un repositorio público no se puede reescribir,
así que el dato seguiría ahí cuando la sociedad sustituya a la persona física en
el aviso legal.

## Variables de ejecución

Las leen las rutas de API al ejecutarse en el Worker, no durante el build. Se
cargan en **Settings › Runtime variables and secrets**, pestaña **Production**,
con tipo **Secret**, o con `npx wrangler secret put` seguido del nombre.
Guardarlas en el panel despliega una versión nueva del Worker. Los valores están
en el gestor de contraseñas del equipo, salvo la `CLAVE_ENLACE_BOLETIN` de
producción.

| Variable                | Contenido                                                                              | Si falta                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `MAILJET_API_KEY`       | Clave de la API de Mailjet                                                             | El envío se detiene con un error antes de llamar a Mailjet                                      |
| `MAILJET_SECRET_KEY`    | Clave secreta de la API de Mailjet                                                     | Igual que la anterior                                                                           |
| `MAILJET_LISTA_BOLETIN` | ID numérico de la lista del boletín en Mailjet                                         | La suscripción y la confirmación del boletín se detienen con un error antes de llamar a Mailjet |
| `CLAVE_ENLACE_BOLETIN`  | Clave de cifrado del enlace de confirmación del boletín, 32 bytes aleatorios en base64 | Igual que la anterior                                                                           |

En el esquema de `astro:env` las cuatro son opcionales a propósito, aunque las
rutas las necesitan. El porqué está comentado en `astro.config.mjs`.

`CLAVE_ENLACE_BOLETIN` es distinta en cada entorno: la de producción no es la de
desarrollo local. Quien tenga la clave puede fabricar un enlace de confirmación
válido para cualquier dirección, así que las copias de desarrollo no deben valer
en producción. Cambiarla invalida los enlaces de confirmación pendientes.

La de producción se generó el 6 de noviembre en la consola del navegador, en una
pestaña en blanco, y se pegó en el panel sin mostrarla:

```js
copy(btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))));
```

Después, `copy("")` vacía el portapapeles. No está en el gestor de contraseñas:
si hace falta otra, se genera nueva de la misma forma. La de desarrollo se
genera con `openssl rand -base64 32` y está en el gestor como clave de
desarrollo.

## Despliegue desde local

El build copia `.dev.vars` a `dist/server/`. Un `npx wrangler deploy` sin
opciones usa la configuración que genera el adaptador, redirigida desde
`.wrangler/deploy/`: sirve los assets de `dist/client` y sube como Worker solo
los `.mjs`, así que `.dev.vars` no viaja. Comprobado con `--dry-run` el 19 de
octubre de 2026, con `wrangler` 4.151.0 y `@astrojs/cloudflare` 14.4.0.

No se despliega con `--config wrangler.json`. Esa configuración declara `./dist`
como carpeta de assets, y esa carpeta contiene `dist/server/.dev.vars`. Al
actualizar `wrangler` o el adaptador, se repite la comprobación con
`npx wrangler deploy --dry-run --outdir` hacia una carpeta temporal.

Workers Builds despliega con el mismo `npx wrangler deploy`, sin `--config`. En
su build no existe `.dev.vars`, que no está en el repositorio. El registro del
despliegue del 6 de noviembre muestra un único binding, `env.ASSETS`. El
apartado **Bindings** del panel no lo lista.

## Comprobación de marcadores

El NIF que publican el aviso legal y las políticas de privacidad y de cookies
llega por `ID_FISCAL`, que solo se define en la compilación de Cloudflare. Sin
ella, las tres páginas salen con el marcador `XXXXXXXXX`.

La comprobación no puede vivir en el job `verify`: allí las variables de
compilación no existen, el build usa siempre el valor por defecto y el marcador
está siempre presente, así que fallaría en cada pull request.

Por eso se ejecuta en el despliegue, después del build y con las variables ya
definidas. `scripts/check-marcadores.mjs` recorre los `.html` de `dist/client/`
y sale con error si encuentra una cadena de cuatro o más equis mayúsculas
seguidas. También sale con error si no encuentra ninguna página, para que un
cambio en la salida del build no pase en verde.

En Workers Builds, el comando de compilación es
`npm run build && node scripts/check-marcadores.mjs`, para que Cloudflare aborte
el despliegue en lugar de publicar una página con el marcador. Comprobado el 6
de noviembre: con `ID_FISCAL` sin definir, el build se abortó y la fase de
despliegue no llegó a ejecutarse.

Esto evita publicar un marcador. No evita publicar un dato mal escrito: el día
de la publicación hay que abrir las páginas legales y leerlas.

## Antes de publicar el sitio

Hacer una suscripción completa en el sitio publicado con una dirección del
equipo: el enlace del correo tiene que apuntar a
`https://inteliaxencia.com/boletin/confirmar`, y al confirmar, la dirección
tiene que quedar en la lista con la IP de quien confirma. Terminada la prueba,
se retira esa dirección de la lista.

Cuando el dominio propio responda, cambiar `workers_dev` a `false` en
`wrangler.json`, en su propio pull request. Hasta entonces, workers.dev es la
única dirección del sitio; después, solo debe servirlo el dominio propio.

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
7. Comprobar en Workers Logs cuánto tiempo se conservan los registros y qué
   datos de cada petición se guardan. La política de privacidad recoge lo que se
   guarde y durante cuánto tiempo. El código del sitio solo registra el motivo
   de un fallo, sin datos del formulario.

## Antes del primer envío de correo

SPF, DKIM y DMARC configurados en el dominio. Lo exige el bloqueo 4.1 de
`AGENTS.md` y no depende de este proyecto de Cloudflare.
