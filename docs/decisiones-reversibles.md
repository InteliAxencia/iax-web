# Decisiones reversibles y sus disparadores

Las decisiones firmes viven en `AGENTS.md`. Esta lista es distinta: son
decisiones tomadas a sabiendas de que pueden cambiar, con el hecho concreto que
obligaría a revisarlas escrito de antemano. Se revisan cuando salta el
disparador, no antes y no por intuición.

## 1. Alojamiento del sitio

**Decisión vigente.** Cloudflare Workers con assets estáticos.

**Por qué.** Consolida DNS, CDN, protección de formularios, alojamiento y
funciones bajo un solo encargado del tratamiento, y es la vía que la
documentación de Astro cubre de forma oficial.

**Lo que no da.** Procesamiento exclusivo en la UE. La localización de datos de
Cloudflare es un complemento exclusivo de Enterprise. La transferencia
internacional se apoya en el contrato de encargo y sus cláusulas contractuales
tipo, y así tiene que constar en la política de privacidad, sin adornos.

**Disparador.** Que un cliente o un pliego imponga por contrato residencia o
procesamiento de datos en la UE, o conformidad con el Esquema Nacional de
Seguridad. Escenario realista con colegios profesionales, sindicatos y
patronales, porque el ENS alcanza a los proveedores de quien presta servicios a
la Administración.

**Qué se evalúa entonces.** Bunny.net (Eslovenia) o Scaleway (Francia) para el
sitio. Si el disparador es el ENS, proveedor con la certificación exigida en el
pliego.

**Coste de la migración mientras se cumplan R1, R2 y R3.** Cambio de adaptador,
archivo de configuración del proveedor y cambio de DNS. Si alguna de las tres
reglas se incumple, deja de ser una migración y pasa a ser una reescritura.

**Lo que este apartado no cubre.** Los desarrollos a medida de la fase 4 para
clientes del ámbito público o paraprofesional. Son proyectos distintos, con su
propia decisión de infraestructura, y ahí el ENS puede ser requisito
eliminatorio.

## 2. Sistema de reservas

**Decisión vigente.** Easy!Appointments autoalojado, versión estable.

**Por qué.** Cal.com movió su código principal de AGPL a licencia propietaria en
abril de 2026. Un componente que guarda datos de citas de clientes del sector
jurídico no puede depender de un proveedor cuya licencia acaba de cambiar de
signo.

**Lo que trae consigo.** Una segunda pieza de infraestructura con PHP y MySQL
que no corre en Workers, con su propio ciclo de parches, copias de seguridad y
monitorización. En ese sistema iAx es responsable del tratamiento y el proveedor
del servidor es encargado.

**Pendiente antes de instalar nada.** Verificar por escrito el archivo de
licencia del repositorio, con el mismo criterio que se aplica a la tipografía
Neurial Grotesk.

**Disparador de revisión.** Que el mantenimiento del proyecto se detenga más de
doce meses, o que aparezca una vulnerabilidad grave sin parche disponible.

## 3. Comprobación de R1 por lista blanca

**Decisión vigente.** `scripts/check-r1.mjs` lee `wrangler.json` y rechaza
cualquier clave que no esté en su lista de permitidas.

**Por qué.** Falla en cerrado. Una lista negra habría ido siempre por detrás del
catálogo de Cloudflare: el día que saliera un producto nuevo, nadie se enteraría
de que ese binding entró. Con lista blanca, una clave desconocida rompe la CI, y
añadirla es una decisión consciente que queda en el diff del pull request.

**Lo que trae consigo.** El archivo tiene que ser `wrangler.json` sin
comentarios, para leerlo con `JSON.parse` sin depender de un parser de JSONC.
Los porqués de la configuración viven en `docs/`, no dentro del archivo.

**Lo que no cubre.** Solo mira las claves de primer nivel de `wrangler.json`. No
detecta lo que el adaptador de Astro active por su cuenta: `@astrojs/cloudflare`
habilita por defecto Cloudflare Images y sesiones sobre Workers KV, y eso se
desactiva en `astro.config.mjs`, no aquí. Al actualizar el adaptador hay que
mirar la salida del build.

**Disparador de revisión.** Que la CI falle por una clave legítima con
demasiada frecuencia, señal de que la lista se quedó corta, o que aparezca una
forma de declarar bindings fuera de `wrangler.json`.

## 4. Análisis de código con CodeQL

**Decisión vigente.** Desactivado.

**Por qué.** Estaba activo por defecto, impuesto por la configuración de
seguridad de la organización, no por elección. Sobre un sitio estático sin
entradas de usuario no aporta y solo añade ruido en la lista de checks.

**Lo que se cambió para poder decidirlo.** La configuración
`InteliAxencia-org-config-1` de la organización tenía Code scanning en
`Enabled` con `Enforce`, lo que bloqueaba cualquier cambio desde el
repositorio. Se pasó a `Not set`, que deja la decisión a cada repositorio sin
levantar la imposición del resto de funciones.

**Disparador.** La primera ruta de API que reciba datos de un formulario, o
cualquier código que trate entrada externa.

**Qué se hace entonces.** Se activa en modo avanzado, con workflow propio fijado
por SHA y versionado en el repositorio. No en modo por defecto: la configuración
tiene que vivir donde se pueda revisar.

## 5. TypeScript en la serie 6

**Decisión vigente.** `typescript` fijado en `^6`.

**Por qué.** `@astrojs/check` declara `^5.0.0 || ^6.0.0` como dependencia de
pares. Al intentar la 7, npm avisó de `ERESOLVE overriding peer dependency`, es
decir, iba a instalar una combinación que la propia herramienta declara no
soportar.

**Cómo se detecta si alguien lo intenta.** Con `engine-strict=true` en
`.npmrc`, `npm ci` falla en lugar de instalar con aviso. Ya ocurrió: el primer
pull request de Dependabot que subía TypeScript a 7.0.2 lo detuvo `verify`.

**Disparador.** Que `@astrojs/check` publique una versión que soporte
TypeScript 7.
