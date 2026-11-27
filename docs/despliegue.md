# Despliegue

El proyecto se creó en Cloudflare el 6 de noviembre de 2026, con Workers Builds.
Este documento recoge cómo está configurado y lo que no puede olvidarse porque
no tiene otra comprobación que lo detecte.

## El proyecto en Cloudflare

Worker `iax-web`, conectado con Workers Builds al repositorio
`InteliAxencia/iax-web`, con `main` como rama de producción: cada push a `main`
compila y despliega. Desde el 24 de noviembre de 2026 se sirve en
`https://inteliaxencia.com`, con `www` redirigido a la raíz (apartado «Dominio
propio y `www`»). El resultado de cada despliegue aparece en GitHub como check
«Workers Builds: iax-web» del commit de `main`, con el `Version ID` desplegado,
así que se puede consultar sin abrir el panel, con
`gh api repos/InteliAxencia/iax-web/commits/<sha>/check-runs`.

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

`wrangler.json` declara `workers_dev: false` y `preview_urls: false`. Cada
`npx wrangler deploy` aplica lo que dice el archivo y pisa lo que se haya
cambiado en el panel, así que estos valores se cambian solo en el archivo.

- `workers_dev: false` retira la dirección de workers.dev desde el 27 de
  noviembre de 2026 (WEBIAX-82, #115), que ahora responde 404. Por workers.dev
  no pasan los ajustes de la zona, como el bloqueo de rastreadores de
  entrenamiento de IA, y el sitio quedaría servido por dos direcciones.
- `preview_urls: false` evita que cada versión desplegada tenga su propia URL
  pública, que seguiría mostrando el contenido de esa versión después de
  sustituirla.

### Dominio propio y `www`

El Worker sirve `inteliaxencia.com` como dominio propio, declarado en
`wrangler.json` dentro de `routes`, con `pattern` y `custom_domain: true`.
Bastan esos dos campos: la zona se deduce del nombre, y no se escribe el ID de
cuenta, el de zona ni ningún token. `routes` está en la lista blanca de
`scripts/check-r1.mjs`.

El dominio propio se creó desde el panel el 24 de noviembre de 2026 y se declaró
en `wrangler.json` el 27, en el #115. La documentación oficial de Cloudflare no
dice si un despliegue sin `routes` conserva un dominio puesto solo en el panel.
Con la declaración en el archivo, cada despliegue lo mantiene: comprobado tras
el despliegue del #115, la raíz sigue respondiendo 200 desde el Worker.

Cloudflare no crea un dominio propio sobre un nombre que ya tiene un CNAME:
antes hubo que borrar el CNAME de la raíz, que apuntaba a la CDN de Hostinger.
Al crearlo, Cloudflare añade a la zona un registro de tipo Worker, con proxy y
bloqueado, y emite su certificado.

`www` no es un dominio propio del Worker. Redirige a la raíz con un 301, para
que el sitio tenga una sola dirección, la de `site` en `astro.config.mjs`. Son
dos piezas de la zona que viven fuera del repositorio:

- un registro AAAA `www` a `100::`, con proxy. `100::` no tiene destino: la
  regla responde antes de que la petición necesite un origen;
- la regla de redirección única «Redirigir de WWW a raíz», en **Rules**: filtro
  `http.host eq "www.inteliaxencia.com"`, destino dinámico
  `concat("https://inteliaxencia.com", http.request.uri.path)`, código 301 y
  cadena de consulta conservada. Filtra por nombre de host para cubrir `http://`
  y `https://`; la plantilla de patrón comodín solo cubre `https://` y pierde la
  consulta.

Se comprueba con `curl -sSI 'https://www.inteliaxencia.com/contacto/?x=1'`, que
tiene que responder 301 a `https://inteliaxencia.com/contacto/?x=1`.

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
los `.mjs`, así que `.dev.vars` no viaja. Comprobado con `--dry-run` el 12 de
noviembre de 2026, con `wrangler` 4.156.1 y `@astrojs/cloudflare` 14.4.6.

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

## Registros del Worker

`wrangler.json` activa Workers Logs con `observability.enabled: true`. Guarda un
registro de cada petición que ejecuta el Worker: las rutas de `src/pages/api/` y
las peticiones que no encuentran un asset. Las páginas estáticas no lo ejecutan.
Cada registro lleva la IP, la ubicación que Cloudflare deduce de ella, todas las
cabeceras de la petición, los datos de TLS, la URL y el estado de la respuesta,
pero no el cuerpo de la petición. Aparte quedan los `console.error` del código,
que solo llevan el motivo de un fallo.

La retención es de siete días en el plan Free de observabilidad, que entra en
vigor el 1 de diciembre de 2026. El 17 de noviembre había registros de casi
cuatro días. Los apartados 3.4 y 5 de la política de privacidad recogen lo que
se guarda y el plazo. Si cambia la retención o lo que se guarda, se revisa la
política.

## Prueba completa del boletín

Se hace en el sitio publicado, con una dirección del equipo: el enlace del
correo tiene que apuntar a `https://inteliaxencia.com/boletin/confirmar`, y al
confirmar, la dirección tiene que quedar en la lista con la IP de quien
confirma. Si esa persona quiere recibir el boletín, la suscripción se queda como
real; si no, se retira de la lista al terminar. La primera prueba completa se
hizo el 24 de noviembre de 2026, en WEBIAX-82.

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
3. Desactivar en la cuenta de Mailjet el seguimiento de aperturas y de clics.
   La política de privacidad afirma que los envíos no los miden.
4. Confirmar que Cloudflare, Inc. sigue en la lista de
   https://www.dataprivacyframework.gov y que los enlaces a las políticas de
   terceros responden.

## Después de publicar en el dominio propio

Estos dos pasos dependen del tráfico que pasa por el proxy de la zona, así que
no se pueden comprobar en workers.dev: solo con el sitio servido por
inteliaxencia.com. Ticket WEBIAX-98.

1. Activar Cloudflare Web Analytics para inteliaxencia.com, con instalación
   automática, y comprobar en la pestaña de red que su script llega a la página.
   Si no llega, se instala a mano en `Base.astro`.
2. Recorrer el sitio servido por inteliaxencia.com en una ventana limpia, con
   las herramientas de desarrollo abiertas: la portada sin interactuar y después
   todas las páginas del menú. En Aplicación, anotar cookies y almacenamiento;
   en Red, los dominios desde los que se carga algo. La tabla de la política de
   cookies se ajusta a lo observado.

## Antes del primer envío de correo

SPF, DKIM y DMARC configurados en el dominio. Lo exige el bloqueo 4.1 de
`AGENTS.md` y no depende de este proyecto de Cloudflare.
