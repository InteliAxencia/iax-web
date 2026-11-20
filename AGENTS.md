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

| Pieza                   | Elección                                      | Nota                                          |
| ----------------------- | --------------------------------------------- | --------------------------------------------- |
| Framework               | Astro 7                                       | Node `^24`, fijado en `.nvmrc` y en `engines` |
| Estilos                 | Tailwind v4 vía `@tailwindcss/vite`           | nunca `@astrojs/tailwind`, está deprecado     |
| Despliegue              | Cloudflare Workers con assets estáticos       | adaptador `@astrojs/cloudflare`               |
| Contenedor              | Dev Container sobre Podman rootless           | Git se queda en el host                       |
| Integraciones previstas | Mailjet, Easy!Appointments, Stripe, Turnstile | sujetas al bloqueo legal de la sección 4      |

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

**Dependencias que suben juntas.** `astro` y `@astrojs/*` dependen unos de
otros por funciones internas, y `@cloudflare/vite-plugin` fija una versión
exacta de `wrangler`. Por eso Dependabot los agrupa en `.github/dependabot.yml`
y se actualizan por parejas. `@cloudflare/vite-plugin` está declarado en
`devDependencies` aunque el código no lo importe: si se quita, Dependabot deja
de verlo, sube `wrangler` solo y aparecen dos copias de `wrangler`, `miniflare`
y `workerd`. No lo quites ni subas `wrangler` por separado. Las acciones de
CodeQL siguen la misma regla: todos los pasos de `codeql.yml` que usan
`github/codeql-action` tienen que ir en la misma versión, o el análisis falla
con un error de configuración. Dependabot las sube juntas con el grupo `codeql`.

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
cualquier otro proyecto. Los formularios envían datos solo desde las rutas de
`src/pages/api/` y solo a los encargados que recoge la política de privacidad.
Un servicio nuevo que reciba datos de un formulario necesita antes su contrato
de encargo y su entrada en la política. Si dudas de si algo cruza esa línea,
pregunta antes de implementarlo.

---

## 4. Bloqueos vigentes

Se levantan por decisión explícita del equipo, nunca por el paso del tiempo.
Hasta entonces, no los rodees ni propongas alternativas para esquivarlos.

**4.1 Capa legal.** Levantado el 13 de octubre de 2026. Están redactados el
aviso legal LSSI-CE y las políticas de privacidad y de cookies, con cada
encargado identificado, aceptados los contratos del artículo 28 del RGPD con
Cloudflare, Mailjet e Infomaniak, y configurados SPF, DKIM y DMARC para
Infomaniak y Mailjet. Las pruebas de envío se hacen solo con direcciones del
equipo, nunca con datos de clientes ni de terceros. Antes de publicar se
recorre `docs/despliegue.md`.

**4.2 Licencia tipográfica.** Mientras no esté verificado el derecho de
incrustación web de Neurial Grotesk, no se commitean archivos de fuente (`.otf`,
`.woff2`) en este repositorio público. Publicarlos podría constituir
redistribución no autorizada. Mientras tanto, el fallback basta.

**4.3 Formateadores.** `prettier` y `prettier-plugin-astro` están fijados en
versión exacta y Dependabot no propone sus actualizaciones. No los actualices ni
propongas actualizarlos: el cambio de formato lo decide el equipo, en un pull
request propio con la subida y el reformateo. Ver la sección 9 de
`docs/decisiones-reversibles.md`.

---

## 5. Git

- Una rama por cambio, con un único responsable. Nunca commits directos a
  `main`. Prefijos `feat/`, `fix/`, `chore/`, `docs/`. No hay otros: `feature/`
  no es válido.
- `main` está protegida por un ruleset: se entra por pull request.
- Para hacer merge de un pull request hace falta la aprobación de la otra
  persona del equipo. El ruleset de `main` exige una aprobación y la anula si
  entran commits nuevos después.
- Los pull requests que abre un bot, como Dependabot, se fusionan con la
  aprobación de una sola persona del equipo: la regla de que no revisa quien
  abre el pull request se cumple igualmente.
- Un pull request de Dependabot se valida con su rama al día con `main`. Para
  ponerla al día se comenta `@dependabot rebase` en el pull request, no se
  aplica el `git merge origin/main` del punto siguiente: Dependabot deja de
  mantener una rama en la que ha escrito otra persona. Ese rebase lo hace
  Dependabot sobre su propia rama, que no lleva commits del equipo, así que no
  afecta a la prohibición de reescribir el historial. Cada merge a `main`
  despliega en producción, así que lo que se valida en local tiene que ser lo
  que se despliega.
- Si `main` avanza mientras un pull request espera revisión, se incorpora a la
  rama con `git fetch` y `git merge origin/main` desde el host, antes de pedir
  la aprobación, porque un commit posterior la anula. Tras resolver los
  conflictos, `npm run format:check`, `npm run check` y `npm run build` antes de
  hacer push. El botón `Update branch` de GitHub y su editor de conflictos no
  sirven: firman con la clave de GitHub, no con la tuya.
- **Solo merge commits.** El squash y el rebase están desactivados en el
  repositorio para preservar las firmas ED25519. Un squash sustituye tus commits
  por uno nuevo firmado por GitHub, y la cadena de firma hasta tu máquina se
  pierde. Un merge commit los conserva.
- **Commits atómicos, un asunto por commit.** No es una regla independiente de
  la anterior: es lo que la hace viable. Si cada rama llega al pull request con
  pocos commits bien definidos, el merge commit no introduce ruido y no hace
  falta hacer squash de nada. Un commit que toca a la vez el andamiaje, la
  identidad visual y un archivo heredado no se puede revertir por partes ni
  localizar con `git bisect`.
- Los commits van firmados con SSH. No propongas comandos que desactiven la
  firma, ni `--no-verify`, ni nada que reescriba el historial.
- Después de cada commit, comprueba la firma y el autor con
  `git log -1 --format='%G? %ae'`. Tiene que salir `G` y el correo de quien hace
  el commit, tal como figura en `.github/allowed_signers`. Que haya firma no
  basta: una firma válida con un correo que no pertenece a ninguna cuenta sale
  como Unverified en GitHub, y el ruleset de `main` la rechaza.
- El mensaje explica el porqué. Si el contexto no se deduce del diff, va en el
  cuerpo del mensaje. **En los merge commits el cuerpo es obligatorio**: no
  tienen diff propio, así que sin él el historial de `main` no dice qué entró.
- Los mensajes de commit, incluidos los cuerpos de los merge commits, y los
  títulos y descripciones de los pull requests van sin tildes ni eñes.
- El formato del mensaje de commit es fijo. No hace falta consultar `git log`
  antes de redactar uno.
  - **Asunto:** `<tipo>: <descripcion>`, en una sola línea. El tipo es `feat`,
    `fix`, `chore` o `docs`, en minúscula y sin ámbito entre paréntesis.
    Describe ese commit, no la rama: una rama puede llevar commits de tipos
    distintos. La descripción empieza por un verbo en infinitivo, en minúscula,
    y no lleva punto final.
  - **Cuerpo:** un solo párrafo de frases completas, sin listas y sin saltos de
    línea dentro. Empieza por el origen del cambio: `<CODIGO>.` si hay ticket;
    si no, la revisión o el pull request que lo pidió, seguido de punto. Después
    explica el porqué y lo que no se deduce del diff. Si el commit hace una
    excepción a una regla, el cuerpo lo dice.
  - Los nombres de archivo, de orden y de clave se escriben tal cual, sin
    comillas invertidas.
  - Sin líneas de atribución ni otros pies.
  - **Merge commits:** el asunto es el que genera GitHub,
    `Merge pull request #<n> from <organizacion>/<rama>`, sin cambios. El cuerpo
    sigue las reglas del cuerpo de un commit, con `<CODIGO>.` al principio. Como
    el merge commit no tiene diff propio, dice qué entra en `main` con ese pull
    request y por qué, visto en conjunto y sin repasar commit por commit.
  - Los commits de los bots, como Dependabot, llevan su propio formato.
- Con `gh`, los títulos y cuerpos van entre comillas simples. Dentro de comillas
  dobles, un `!` como el de «Easy!Appointments» activa la expansión del
  historial de bash y se come la línea.
- La configuración vive en dos sitios y el ruleset manda. `Settings` → `General`
  define qué métodos permite el repositorio; el ruleset de `main` define cuáles
  permite esa rama. Si se contradicen, GitHub bloquea el merge sin explicar por
  qué: el desplegable del botón aparece vacío.

Git se ejecuta desde el host, no desde el Dev Container. La clave de firma, el
hook de pre-commit y `gitleaks` viven en el host a propósito. El hook
`identidad` rechaza el commit si el correo del autor o del committer no está en
`.github/allowed_signers`; un merge sin conflictos no pasa por él, y ese caso lo
cubre la regla de commits firmados del ruleset. En el contenedor,
`.devcontainer/bin/git` bloquea las órdenes que crean commits o necesitan
identidad: si aparece su mensaje, la orden se repite en el host. La identidad de
Git no se configura en el contenedor.

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

La guía de marca completa vive fuera del repositorio. Si una decisión de copy no
está resuelta aquí, consúltala antes de escribir.

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
- Llamadas a la acción con verbos directos, en la línea de las que ya existen en
  el sitio. Un botón por destino distinto. Varios botones al mismo destino, solo
  si lo pide explícitamente quien dirige. Un enlace de texto en lugar de botón,
  también solo por petición explícita de quien dirige.
- Nombra los límites. Lo que la IA no resuelve se dice.
- El microcopy de formularios, errores y estados vacíos mantiene la misma
  calidez que el resto.

### Listas

Los elementos de una lista siguen uno de dos criterios.

- Si completan una frase de presentación que acaba en dos puntos, empiezan en
  minúscula, van separados por punto y coma y el último termina en punto. Es el
  caso de las listas de servicios.
- Si son independientes, sin frase de presentación, empiezan en mayúscula y cada
  uno termina en punto. Es el caso de funcionalidades.

Estos criterios valen para las listas de frases de la copy del sitio. Quedan
fuera las listas de rótulos o nombres sueltos, como las áreas de servicios o las
fichas del equipo, y las listas de datos de las páginas legales, con forma de
etiqueta y dato.

---

## 8. Convenciones de código

- Contenido, nombres de componentes y comentarios **en español**. Quedan fuera
  los nombres que impone el framework o una API externa, como `getStaticPaths`,
  `prerender` o los campos de Mailjet, y las clases y los tokens heredados del
  prototipo, como `.wrap`, `.btn` o `--color-indigo-deep`. Las clases y los
  tokens nuevos van en español. Excepción: el boletín conserva el nombre
  «newsletter» en su componente (`Newsletter.astro`), en su ancla
  (`/#newsletter`) y en los textos que ya lo usan. Los comentarios se escriben
  con tildes y eñes, como cualquier texto en español. Los mensajes de commit y
  los títulos y descripciones de los pull requests siguen sin ellas (sección 5).
- Componentes en `src/components/`, layouts en `src/layouts/`, páginas en
  `src/pages/` y endpoints en `src/pages/api/`. La lógica de negocio vive en
  `src/lib/` (R2, sección 10); el `@theme` y los estilos compartidos, en
  `src/styles/global.css`; y las imágenes que Astro procesa al compilar, en
  `src/assets/`.
- Los datos repetidos van en un array y se recorren. No se duplican en el
  marcado. Un dato es repetido cuando varios elementos comparten estructura y
  solo cambia su contenido: tarjetas, pasos, preguntas, fichas del equipo,
  enlaces de navegación u opciones de formulario. Los elementos con estructura o
  destino distintos se escriben aparte, aunque vayan en la misma lista. Una
  configuración que usan a la vez la página y el servidor, como las de
  `src/lib/formularios.ts`, se define una sola vez y la leen los dos. Quedan
  fuera las páginas legales, que son texto redactado, también en sus tablas.
- Astro no envía JavaScript por defecto. Mantenlo así. El JavaScript propio va
  en el `<script>` del componente y mejora algo que ya funciona sin él, como los
  formularios, que sin JavaScript envían por POST a su ruta. Si una función no
  puede existir sin JavaScript, un `<noscript>` da la alternativa, como en la
  confirmación del boletín. El sitio no tiene islas: instalar un framework de
  interfaz para crearlas es decisión del equipo, y a la isla se le aplica el
  mismo criterio.
- Si hay un prototipo estático en la raíz, es referencia visual, no fuente de
  verdad, y no es el destino de los cambios de producto.
- Cuidado con la especificidad del CSS. Un selector de contexto puede pisar la
  clase de un componente y arruinar el contraste o la disposición. Por ejemplo,
  `.nav-links a`, que vale (0,1,1), ganaba a `.btn-indigo`, que vale (0,1,0), y
  dejaba el botón de la navegación con texto oscuro sobre índigo. Cuando un
  elemento con clase de componente está dentro de un contexto con reglas
  propias, comprueba en el navegador qué regla gana: las herramientas de
  desarrollo muestran la especificidad de cada selector. Las `@media` no suman
  especificidad: deciden si una regla se aplica, no cuánto pesa.
- El CSS de un componente vive en su `<style>`, no en atributos `style`, y
  consume los tokens de `@theme` con `var()`. Ningún componente escribe un color
  suelto, en ninguna notación: ni hexadecimal, ni `rgb()`, ni `hsl()`, ni
  nombres como `white`. Un color con transparencia se obtiene del token con
  `color-mix(in srgb, var(--color-…) 18%, transparent)`. Si falta un token, se
  añade al `@theme`. Excepción: el `theme-color` de `Base.astro` va escrito
  literal, porque un `<meta>` no puede leer `var()`, y lo anota un comentario en
  el propio archivo.
- Toda superficie con fondo índigo o índigo profundo lleva la clase
  `.sobre-indigo`. Son superficies las secciones y los bloques que contienen
  elementos enfocables, no los botones. La clase cambia el anillo de foco a
  coral: sin ella el foco es índigo sobre índigo y no se ve. Afecta a todo lo
  que va dentro, así que un bloque de fondo claro con enlaces dentro de una
  superficie `.sobre-indigo` tiene que recuperar el anillo índigo: el coral
  sobre blanco no llega a 3:1.
- Punto de ruptura único en 821px, salvo razón concreta. La razón de una
  excepción se anota en un comentario del CSS del componente, junto a su
  `@media`.

### Suelo de calidad

Esto ya está resuelto y no puede perderse en ninguna migración:

1. **Mobile first.** Los estilos base son para móvil y los `@media (min-width)`
   escalan hacia arriba.
2. **Foco visible.** `:focus-visible` perceptible en todo elemento interactivo,
   con un contraste de al menos 3:1 frente a lo que lo rodea.
3. **`prefers-reduced-motion` respetado**, sin excepciones. La regla de
   `global.css` elimina animaciones y transiciones con `!important`. Un script
   que mueva algo, como un desplazamiento suave, comprueba antes la preferencia
   con `matchMedia`: la regla de CSS no lo alcanza.
4. **Contraste WCAG AA** como mínimo: 4.5:1 en texto normal, 3:1 en texto grande
   y 3:1 en lo que identifica un control, como el borde de un campo o el anillo
   de foco. Quedan fuera los controles desactivados y los elementos decorativos.
5. **HTML nativo antes que JavaScript.** Los acordeones son
   `<details>`/`<summary>` y la exclusión mutua se consigue con el atributo
   `name`, no con un script. Un `<details>` cerrado no pinta a sus
   descendientes, y `display` no lo revierte. Si el contenido debe verse con el
   `<details>` cerrado, va como hermano y la apertura se lee con el combinador
   `~`. Los formularios conservan la validación nativa sin JavaScript:
   `novalidate` lo pone el script al cargar, no el HTML.
6. Todo campo con su `<label>` asociado, por `for` o por anidación, y los
   mensajes de estado con `role="status"`. Un campo cuya etiqueta visible es la
   opción de al lado, como el texto de «Otro», puede llevar `aria-label`. La
   región de estado está en el marcado desde el principio y el script solo
   cambia su texto: si nace ya con el mensaje, puede no anunciarse.

---

## 9. Qué no vive en este repositorio

- El esquema comercial y la guía de marca, que están en Drive.
- Las configuraciones de Mailjet, Easy!Appointments y Stripe, y los contactos, que quedan
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
