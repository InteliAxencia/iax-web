# AGENTS.md

Convenciones del repositorio `iax-web`. Léelo entero antes de proponer o escribir
cualquier cambio.

Este archivo describe **cómo se trabaja aquí**, no en qué punto está el proyecto.
Para saber qué existe ya, lee el repositorio. Si algo que se menciona aquí
todavía no está montado, no lo improvises: pregunta.

**El repositorio es público.** Todo lo que entre queda visible de forma
permanente, incluido el historial. Antes de escribir cualquier valor, pregúntate
si te importaría verlo indexado en un buscador.

---

## 1. El proyecto

`iax-web` es el sitio comercial de **iAx (inteliAxencia)**. iAx analiza procesos,
forma equipos e implementa soluciones de IA y automatización para despachos y
asesorías del ámbito jurídico y laboral: abogados laboralistas, graduados
sociales, colegios profesionales y departamentos laborales y de recursos humanos.

Lo que el sitio transmite es **recuperar tiempo de trabajo**, no vender
tecnología. Quien lo lee es un profesional del Derecho, no una persona técnica:
lenguaje claro, tareas concretas y horas, no conceptos abstractos.

Es un proyecto comercial, no un experimento. Las decisiones recogidas aquí se
tomaron de forma explícita y no se revierten por comodidad ni por prisa.

---

## 2. Stack y comandos

| Pieza                   | Elección                                    | Nota                                          |
| ----------------------- | ------------------------------------------- | --------------------------------------------- |
| Framework               | Astro 7                                     | Node `^24`, fijado en `.nvmrc` y en `engines` |
| Estilos                 | Tailwind v4 vía `@tailwindcss/vite`         | nunca `@astrojs/tailwind`, está deprecado     |
| Despliegue              | Cloudflare Workers con assets estáticos     | adaptador `@astrojs/cloudflare`               |
| Contenedor              | Dev Container sobre Podman rootless         | Git se queda en el host                       |
| Integraciones previstas | Brevo, Easy!Appointments, Stripe, Turnstile | sujetas al bloqueo legal de la sección 4      |

Comandos:

- `npm run dev`. No lleva `--host` a propósito, para no exponer el servidor a la
  red local.
- `npm run dev:host` solo cuando necesites probar desde otro dispositivo.
- `npm run build` y `npm run preview`.
- `npm run format` aplica Prettier y `npm run format:check` solo comprueba.
- `npm run check` ejecuta `astro check`, que valida tipos y plantillas.
- Antes de abrir un pull request: `format:check`, `check` y `build`. Es lo mismo
  que ejecuta el job `verify`, así que fallar en local ahorra una vuelta.
- Instalación: `npm ci`, que ya respeta el `.npmrc` del repositorio, o
  `npm install --ignore-scripts`. Sin excepciones no documentadas.

**Servidor de desarrollo en segundo plano.** Astro 7 detecta cuando quien lanza
`astro dev` es un agente y arranca el servidor como proceso separado, sin
bloquear la terminal. Registra URL y PID en `.astro/dev.json` para impedir
servidores duplicados. Antes de arrancar uno, comprueba si ya hay otro vivo:

- `astro dev status` da URL, PID y tiempo en marcha.
- `astro dev logs`, con `-f` para seguir la salida.
- `astro dev stop` lo detiene. Déjalo parado al terminar la tarea.
- `npm run dev -- --background` fuerza el modo desde una sesión interactiva.
  `ASTRO_DEV_BACKGROUND=0` desactiva la detección automática.

Tailwind v4 se configura desde CSS con `@theme`. No crees `tailwind.config.js`.

**Renderizado:** `output: 'static'` más adaptador. Todas las páginas se
prerenderizan y solo los endpoints de `src/pages/api/` llevan
`export const prerender = false`. No pases el sitio a `output: 'server'`:
renderizaría en cada visita páginas que no cambian nunca y perdería la caché
del CDN.

---

## 3. Seguridad

No son preferencias. No admiten excepción por comodidad ni por prisa.

### Secretos

- Nunca escribas una credencial, token, clave o identificador de cuenta en el
  código, ni como valor de ejemplo ni comentado.
- Las variables se declaran en el esquema de `astro:env` en `astro.config.mjs`.
  Las de servidor van con `access: "secret"`, así no pueden acabar en el bundle
  del cliente.
- Los valores reales viven en las variables de proyecto de Cloudflare y en el
  gestor de contraseñas del equipo. Nunca en Drive, correo ni mensajería.
- Secretos de desarrollo local: `.dev.vars`, que está en `.gitignore`. Wrangler
  no lee `.env` para esto. El archivo `.dev.vars.example` lleva los nombres de
  las claves, nunca sus valores.
- Hay un hook de `gitleaks` en pre-commit. Si salta, se resuelve. No se silencia.

### Validación

- Precios, cupones, descuentos y cualquier condición comercial se validan **solo
  en servidor**. Una comparación en el navegador es esquivable por mucho que el
  valor sea secreto.
- Nunca pongas un valor promocional real en código de cliente, ni siquiera como
  demostración. Un valor de prueba debe ser inequívocamente falso.
- Un código promocional quedó expuesto en el historial de este repositorio y se
  considera comprometido de forma permanente. La mitigación es operativa: no se
  creará ningún cupón con ese valor en Stripe. No lo reintroduzcas al copiar
  código antiguo.

### Datos personales

La clientela es del sector jurídico, así que el listón está más alto que en
cualquier otro proyecto. Ningún formulario envía datos a un servicio externo
mientras siga vigente el bloqueo de la sección 4. Si dudas de si algo cruza esa
línea, pregunta antes de implementarlo.

---

## 4. Bloqueos vigentes

Se levantan por decisión explícita del equipo, nunca por el paso del tiempo.
Hasta entonces, no los rodees ni propongas alternativas para esquivarlos.

**4.1 Capa legal.** Sin aviso legal LSSI-CE, política de privacidad, política de
cookies y contratos del artículo 28 del RGPD con cada encargado del tratamiento,
ningún formulario se conecta a un servicio real. Los formularios simulan el envío
y ningún dato sale del navegador. Antes del primer envío de correo hacen falta
SPF, DKIM y DMARC configurados.

**4.2 Licencia tipográfica.** Mientras no esté verificado el derecho de
incrustación web de Neurial Grotesk, no se commitean archivos de fuente (`.otf`,
`.woff2`) en este repositorio público. Publicarlos podría constituir
redistribución no autorizada. Mientras tanto, el fallback basta.

---

## 5. Git

- Una rama por cambio, con un único responsable. Nunca commits directos a
  `main`. Prefijos `feat/`, `fix/`, `chore/`, `docs/`. No hay otros: `feature/`
  no es válido.
- `main` está protegida por un ruleset: se entra por pull request.
- **Solo commits de fusión.** El aplastado y el rebase están desactivados en el
  repositorio para preservar las firmas ED25519. Un squash sustituye tus commits
  por uno nuevo firmado por GitHub, y la cadena de firma hasta tu máquina se
  pierde. Un merge commit los conserva.
- **Commits atómicos, un asunto por commit.** No es una regla independiente de
  la anterior: es lo que la hace viable. Si cada rama llega al pull request con
  pocos commits bien definidos, el merge commit no introduce ruido y no hace
  falta aplastar nada. Un commit que toca a la vez el andamiaje, la identidad
  visual y un archivo heredado no se puede revertir por partes ni localizar con
  `git bisect`.
- Los commits van firmados con SSH. No propongas comandos que desactiven la
  firma, ni `--no-verify`, ni nada que reescriba el historial.
- El mensaje explica el porqué. Si el contexto no se deduce del diff, va en el
  cuerpo del mensaje. **En los merge commits el cuerpo es obligatorio**: no
  tienen diff propio, así que sin él el historial de `main` no dice qué entró.
- La configuración vive en dos sitios y el ruleset manda. `Settings` → `General`
  define qué métodos permite el repositorio; el ruleset de `main` define cuáles
  permite esa rama. Si se contradicen, GitHub bloquea el merge sin explicar por
  qué: el desplegable del botón aparece vacío.

Git se ejecuta desde el host, no desde el Dev Container. La clave de firma, el
hook de pre-commit y `gitleaks` viven en el host a propósito.

---

## 6. Marca

| Token           | Valor                 | Uso                                  |
| --------------- | --------------------- | ------------------------------------ |
| Índigo          | `#1B0F96`             | Dominante, en torno al 60 por ciento |
| Índigo profundo | `#140B6E`             | Capas sobre índigo, estados hover    |
| Coral           | `#FD8F96`             | Acento, en torno al 10 por ciento    |
| Blanco y negro  | `#FFFFFF` y `#111111` | Neutros, en torno al 30 por ciento   |

Tipografía: Neurial Grotesk, con fallback a Helvetica Neue y Arial.

Reglas que no se deducen de los tokens:

- El coral es acento, no color de texto. No lo uses en texto pequeño sobre
  blanco, no cumple contraste. Sobre fondo índigo sí tiene recorrido.
- El coral nunca como campo de fondo extenso.
- La `x` del logotipo va en coral. Es la firma visual de la marca.
- Escritura del nombre: **iAx** e **inteliAxencia**. Nunca IAX, Iax ni iax.

---

## 7. Copy

Registro: castellano peninsular con **tuteo**. Nada de voseo. El usted queda
reservado a textos legales y contractuales.

### Prohibiciones

- **Sin rayas ni guiones largos** en ningún texto. Usa coma, dos puntos o punto.
- **«Auditoría» no se usa.** El término es «diagnóstico».
- **«Liderar» no se usa**, ni el verbo ni ninguno de sus derivados.
- **Sin nombres de fase ni de producto comercial.** La copy describe qué se hace,
  no en qué etapa encaja. Si necesitas un nombre y no te lo han dado, no lo
  inventes: pregunta.
- **Sin bloques de precio.** Tampoco plazos, ROI, garantías ni cifras de
  resultado. Son compromisos comerciales y no se redactan por iniciativa de un
  agente.

### Preferencias

- «Digitalización» y «transformación digital» no son el eje de la propuesta.
  Habla de tareas, procesos y horas.
- Frases cortas, una idea por frase. Primero la conclusión, después la
  justificación.
- Llamadas a la acción con verbos directos, una por sección, en la línea de las
  que ya existen en el sitio.
- Nombra los límites. Lo que la IA no resuelve se dice.
- El microcopy de formularios, errores y estados vacíos mantiene la misma
  calidez que el resto.

La guía de marca completa vive fuera del repositorio. Si una decisión de copy no
está resuelta aquí, consúltala antes de escribir.

---

## 8. Convenciones de código

- Contenido, nombres de componentes y comentarios **en español**.
- Componentes en `src/components/`, layouts en `src/layouts/`, endpoints en
  `src/pages/api/`.
- Los datos repetidos (tarjetas de servicio, pasos del método, preguntas
  frecuentes) van en un array y se recorren. No se duplican en el marcado.
- Astro no envía JavaScript por defecto. Mantenlo así: si un componente no
  necesita interactividad, no le añadas una isla.
- Si hay un prototipo estático en la raíz, es referencia visual, no fuente de
  verdad, y no es el destino de los cambios de producto.
- Cuidado con la especificidad del CSS. Un selector de contexto puede pisar la
  clase de un componente y arruinar el contraste o la disposición. Ya ha pasado
  dos veces: con el botón del menú y con una regla `:not([open])` que ganaba en
  escritorio a un bloque que no declaraba `display`. Las `@media` no suman
  especificidad.
- El CSS de un componente vive en su `<style>` y consume los tokens de `@theme`
  con `var()`. Ningún componente redeclara un hexadecimal. Si falta un token, se
  añade al `@theme`; no se escribe el valor suelto.
- Toda superficie con fondo índigo lleva la clase `.sobre-indigo`. Cambia el
  anillo de foco a coral: sin ella el foco es índigo sobre índigo y no se ve.
- Punto de ruptura único en 821px, salvo razón concreta y anotada.

### Suelo de calidad

Esto ya está resuelto y no puede perderse en ninguna migración:

1. **Mobile first.** Los estilos base son para móvil y los `@media (min-width)`
   escalan hacia arriba.
2. **Foco visible.** `:focus-visible` perceptible en todo elemento interactivo.
3. **`prefers-reduced-motion` respetado**, sin excepciones.
4. **Contraste WCAG AA** como mínimo en todo texto.
5. **HTML nativo antes que JavaScript.** Los acordeones son
   `<details>`/`<summary>` y la exclusión mutua se consigue con el atributo
   `name`, no con un script.
   Un `<details>` cerrado no pinta a sus descendientes, y `display` no lo
   revierte. Si el contenido debe verse con el `<details>` cerrado, va como
   hermano y la apertura se lee con el combinador `~`.
6. Todo campo con su `<label>` asociado y los mensajes de estado con
   `role="status"`.

---

## 9. Qué no vive en este repositorio

- El esquema comercial y la guía de marca, que están en Drive.
- Las configuraciones de Brevo, Easy!Appointments y Stripe, y los contactos, que quedan
  fuera del control de versiones y necesitan su propia rutina de exportación.
- Los secretos, que están en el gestor de contraseñas del equipo.
- Los archivos de fuente, mientras siga vigente el bloqueo 4.2.

No hay `LICENSE`: se aplica el copyright por defecto. Este código no es abierto.

## 10. Portabilidad del alojamiento

El alojamiento es una decisión reversible, no un cimiento. Estas dos reglas son
lo que mantiene barata esa reversibilidad. Su porqué y el disparador que obliga
a revisar la decisión están en `docs/decisiones-reversibles.md`.

### R1. Sin servicios propietarios de Cloudflare

Prohibidos: Workers KV, D1, Durable Objects, R2, Queues, Hyperdrive, Vectorize,
Workers AI y Secrets Store.

Permitido: servir los assets estáticos y ejecutar las rutas de API. Nada más.
El único binding admitido en `wrangler.json` es `assets`. Los secretos se
cargan con `wrangler secret put`, que es configuración de despliegue y no crea
dependencia en el código.

El archivo va en `wrangler.json`, sin comentarios, para que la comprobación de
R1 pueda leerlo con `JSON.parse` sin depender de un parser de JSONC. Los porqués
viven en `docs/`.

Ojo con el adaptador: `@astrojs/cloudflare` activa por defecto Cloudflare Images
y sesiones sobre Workers KV sin que nadie escriba nada. Se desactivan en
`astro.config.mjs` con `imageService: "compile"` y `session: false`. Si actualizas
el adaptador, comprueba la salida del build.

### R2. Rutas de API finas

Cada ruta hace cuatro cosas y ninguna más: leer el cuerpo, validar el esquema,
llamar a una función de `src/lib/` y devolver la respuesta.

La lógica de negocio vive en `src/lib/`, en funciones sin variables globales del
runtime y sin ninguna importación de `cloudflare:*`. La configuración se lee
siempre por `astro:env`, nunca del contexto del runtime.

Criterio de verificación: si mañana cambias el adaptador, `src/lib/` no se toca.

### R3. Comprobación automática, no confianza

Las dos reglas anteriores se comprueban en el job `verify`. Una regla escrita se
incumple sola el día que entra alguien nuevo.

R1 se comprueba con `scripts/check-r1.mjs`, que es una lista blanca: solo pasan
las claves enumeradas ahí y cualquier otra rompe la CI. Falla en cerrado a
propósito, así que un producto nuevo de Cloudflare no se cuela sin que nadie se
entere. Añadir una clave a esa lista es una decisión consciente y queda en el
diff del pull request.

R2 se comprueba con `grep` sobre `src/`, y eso sí va por detrás: detecta las
importaciones de `cloudflare:` y las lecturas de `locals.runtime`, pero no puede
cubrir todas las formas de atarse al runtime. Ahí la puerta real es la revisión.

## 11. Método de trabajo

Esta sección no describe el código, describe cómo se trabaja sobre el. Aplica a
cualquier agente y a cualquier persona que edite mediante scripts. Es R3 llevado
al estado de los archivos: comprobación, no confianza.

### M1. El estado del archivo se lee, no se recuerda

Toda edición va precedida, en el mismo turno, de la lectura del tramo que se va
a modificar: `sed -n`, `grep -n` o `cat -n`. No vale haberlo leído antes en la
sesión. Prettier, un hook o una edición propia lo han podido cambiar desde
entonces.

Cualquier afirmación sobre lo que contiene un archivo va acompañada de la salida
del comando que lo leyó. Si no se puede citar de qué comando y de qué momento
sale, se lee primero.

### M2. Un archivo en el contexto no es el repositorio

Los archivos adjuntos al proyecto o pegados en la conversación son una foto del
momento en que se subieron. Sirven de referencia, nunca de fuente sobre el
estado actual. «Lo tengo» no equivale a haberlo leído hoy y no autoriza a
escribir contra él.

Corolario: no se suben al proyecto archivos de `src/`. Envejecen en el primer
commit.

### M3. La cadena de búsqueda no se escribe a mano

Una sustitución no puede depender de acertar espacios, sangría y saltos de
línea. El script localiza la línea por su contenido y toma la sangría del propio
archivo.

Un `assert` sobre texto literal inventado no aporta seguridad. Falla, y cada
fallo deja el archivo un paso más lejos de donde se cree que está.

### M4. Una modificación estructural, un script

Si el archivo queda sintácticamente inválido entre dos pasos, esos dos pasos
eran uno. Quitar una etiqueta de cierre y recolocarla son la misma operación, no
dos.

### M5. Después de escribir, `git diff`

Ninguna edición se da por buena por el `ok` que imprime el script. Se comprueba
con `git diff` sobre el archivo tocado. Si la edición era estructural, además
`npm run format:check && npx astro check` antes de seguir, no al final del
bloque.

### M6. Medir antes de corregir. Dos intentos y se para

Ante un fallo, primero la comprobación que distingue entre las hipótesis,
después el arreglo. Una explicación plausible sin medición previa cuesta más que
la medición.

Dos intentos fallidos sobre el mismo síntoma cierran la vía: se deja de proponer
arreglos, se vuelca el archivo entero o se mide el elemento, y se reanuda desde
la evidencia. Anunciar que se deja de suponer no cuenta como medir.

### M7. El alcance y el orden los decide quién dirige

Cuando se pide una tarea, no se aplaza por decisión del agente. Si hay motivo
para posponerla se expone y se espera respuesta.

La revisión de quien dirige no es el control de calidad del agente. Detectar los
fallos propios no se delega.

---

Ante la duda, pregunta antes de escribir. Un cambio que rompe una de estas
reglas cuesta bastante más de deshacer que de consultar.
