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

## Antes del primer envío de correo

SPF, DKIM y DMARC configurados en el dominio. Lo exige el bloqueo 4.1 de
`AGENTS.md` y no depende de este proyecto de Cloudflare.
