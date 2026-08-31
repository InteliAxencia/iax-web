> **Documento explicativo.** La norma vigente es la sección 5 de `AGENTS.md`, en el repositorio. Este documento la desarrolla y explica el porqué de cada regla, pero no la sustituye. Si algo aquí contradice a `AGENTS.md`, manda `AGENTS.md` y este documento está desactualizado.
>
> Última alineación: 27 de agosto de 2026.

## 1. Objetivo

Esta política define unas reglas comunes para trabajar con Git de forma segura, predecible y fácil de mantener.

El objetivo principal es:

- Evitar conflictos innecesarios entre desarrolladores.

- Mantener `main` estable y con un historial fácil de entender.

- **Preservar la firma criptográfica de cada commit que entra en** `main`.

- Facilitar el trabajo mediante Pull Requests.

- Evitar que un desarrollador sobrescriba accidentalmente el trabajo de otro.

- Establecer reglas claras para ramas, commits y merges.

El tercer punto condiciona a los demás. `iax-web` es un repositorio público de un proyecto comercial dirigido al sector jurídico, y la trazabilidad de quién escribió cada línea forma parte del listón de seguridad del proyecto.

## 2. Flujo general de trabajo

El flujo será:

```text
main
 │
 ├── feat/astro-scaffold
 ├── feat/site-content
 ├── fix/validacion-formulario
 ├── chore/audit-fix
 └── docs/git-merge-strategy
```

Los prefijos válidos son `feat/`, `fix/`, `chore/` y `docs/`. No hay otros. `feature/` **no** es válido.

Cada cambio debe realizarse en una rama propia y posteriormente integrarse mediante un Pull Request.

Flujo habitual:

```text
main
  ↓
crear rama
  ↓
desarrollar en commits atómicos
  ↓
push
  ↓
Pull Request
  ↓
Code Review + CI
  ↓
Merge Commit
  ↓
main
```

No se trabaja directamente sobre `main`.

## 3. Regla de propiedad de las ramas

### Regla principal

**Una rama de trabajo debe tener un único responsable.**

Por ejemplo:

```text
feat/login    → desarrollador A
feat/payment  → desarrollador B
```

No se recomienda que dos desarrolladores trabajen simultáneamente sobre la misma rama.

### ¿Por qué?

Compartir una rama aumenta considerablemente el riesgo de:

- conflictos;

- commits difíciles de atribuir;

- sobrescribir trabajo de otro desarrollador;

- dificultad para saber qué cambios pertenecen a cada persona.

### ¿Qué hacemos si dos desarrolladores necesitan trabajar en la misma funcionalidad?

Preferentemente:

1. Dividir la funcionalidad en tareas más pequeñas.

2. Crear una rama por tarea.

3. Crear Pull Requests independientes.

Por ejemplo:

```text
feat/payment
    │
    ├── feat/payment-api
    └── feat/payment-ui
```

Otra opción es realizar **pair programming**: un desarrollador trabaja en la rama mientras el otro colabora en tiempo real.

### Excepción

Si excepcionalmente es imprescindible compartir una rama, ambos desarrolladores deben coordinarse de forma explícita. Las reglas de las secciones 8 y 9 (nada de rebase ni de force push) ya cubren los riesgos principales y siguen aplicando sin excepción.

## 4. Protección de `main`

`main` está protegida mediante un **ruleset** de GitHub.

Reglas activas:

- No se permite push directo a `main`.

- Todos los cambios llegan mediante Pull Request.

- El Pull Request debe pasar los checks de CI.

- El Pull Request debe recibir la revisión requerida.

- No se permite force-push sobre `main`.

- No se permite eliminar `main`.

- El único método de integración permitido es **Merge Commit**.

> Nadie debe poder sobrescribir accidentalmente `main`.

### Dónde vive la configuración

En dos sitios, y conviene saberlo porque se contradicen con facilidad:

- `Settings` → `General` → **Pull Requests** define qué métodos permite el repositorio en general.

- `Settings` → `Rules` → **Rulesets** define cuáles permite la rama `main`.

**El ruleset manda.** Si el ajuste general permite un método y el ruleset no, el merge queda bloqueado y el desplegable del botón aparece vacío, sin explicar el motivo. Al cambiar uno hay que cambiar el otro.

## 5. Pull Requests

Todo cambio significativo debe integrarse mediante Pull Request.

Un Pull Request debe:

- Tener una descripción clara.

- Explicar qué problema resuelve.

- Incluir información relevante para probar el cambio.

- Documentar las limitaciones conocidas que deja abiertas.

- Pasar los checks automáticos.

- Ser revisado por otro desarrollador cuando corresponda.

### Los commits son atómicos desde el principio

Como los commits de la rama se conservan en `main` (ver sección 6), no hay una fase posterior donde limpiarlos. La calidad del historial se decide al commitear.

Un commit, un asunto. Esto **no** es aceptable:

```text
Add login form
Fix validation
Fix tests
Address review comments
Fix typo
```

Esto sí:

```text
feat: formulario de acceso con validación en servidor
fix: corrige el contraste del botón de envío
```

Un commit que toca a la vez el andamiaje, la identidad visual y un archivo heredado no se puede revertir por partes ni localizar con `git bisect`.

### Si una rama ya acumuló commits desordenados

No se reescribe. La vía es crear una rama nueva desde `main` y recomponer el trabajo en commits atómicos, con `git cherry-pick` o rehaciendo los cambios. Se crean commits nuevos en lugar de alterar los existentes, que es distinto de reescribir una rama publicada.

## 6. Estrategia de integración: Merge Commit

La estrategia para integrar Pull Requests en `main` es:

**Merge Commit.**

Los commits de la rama se conservan íntegros y se añade un commit de fusión que los une a `main`.

```text
A---B---C---------M
     \           /
      D---E---F--
```

### Por qué

**Preserva las firmas.** Es la razón principal. Los commits se firman con SSH usando una clave ED25519. Un Merge Commit conserva esos commits en el historial de `main`, con su firma intacta y verificable hasta la máquina de quien los escribió. Cualquier estrategia que sustituya los commits por otros nuevos rompe esa cadena.

Otras ventajas:

- Conserva todos los commits y su autoría real.

- Muestra explícitamente cuándo una rama fue integrada.

- No requiere reescribir la historia en ningún momento.

### Desventajas

- `main` acumula un commit de fusión por cada Pull Request.

- Si las ramas llegan con commits desordenados, el historial se ensucia.

La segunda desventaja es la única que importa, y **se resuelve con la regla de commits atómicos de la sección 5**. Las dos reglas no son independientes: los commits atómicos son la condición que hace viable el Merge Commit sin llenar `main` de ruido.

### El cuerpo del mensaje es obligatorio

Un Merge Commit no tiene diff propio. Sin cuerpo, lo único que queda en `main` es «Merge pull request #N», que no dice qué entró ni por qué. El cuerpo del mensaje de fusión resume el conjunto del cambio.

## 7. ¿Por qué no utilizar Squash Merge?

Otra posibilidad sería aplastar cada Pull Request en un único commit:

```text
feat/login

A -- B -- C -- D
```

Después del Pull Request:

```text
main

A -- B -- C -- LOGIN
```

### Ventajas

- Historial de `main` muy limpio.

- Un commit representa una funcionalidad completa.

- Los commits temporales no llegan a `main`.

### Por qué no es nuestra estrategia

**Rompe la firma.** El commit aplastado es un commit nuevo, creado y firmado por GitHub, no por el autor. Los commits originales, con su firma ED25519, desaparecen del historial de `main`. En un repositorio donde la trazabilidad criptográfica es parte del modelo de seguridad, esa pérdida no compensa la ganancia en legibilidad.

Además:

- Se pierde el historial detallado de desarrollo.

- Para investigar cómo evolucionó una funcionalidad hay que consultar el Pull Request, que depende de que GitHub siga existiendo y accesible.

Esto no significa que el Squash Merge sea incorrecto en general. Es una estrategia perfectamente válida en proyectos donde la firma por commit no es un requisito.

## 8. Rebase

**El rebase está desactivado en este repositorio y no se utiliza.**

Un rebase reescribe commits: `D` y `E` dejan de existir y se crean `D'` y `E'` con hashes distintos.

```text
main:     A---B---C
               \
feature:         D---E
```

Después de un rebase sobre `main`:

```text
A---B---C---D'---E'
```

Aunque los commits recreados se vuelvan a firmar con la clave local, dejan de ser los mismos objetos, y el historial pierde la correspondencia con lo que se revisó. Sumado a que obliga a reescribir la rama publicada (sección 9), queda fuera del flujo.

Para mantener una rama actualizada con `main`, ver la sección 10.

## 9. Regla para `force push`

**No se hace force push en este repositorio.** Ni `--force` ni `--force-with-lease`, ni sobre `main` ni sobre ramas personales.

`--force-with-lease` es efectivamente más seguro que `--force`, porque comprueba que la rama remota sigue en el estado esperado antes de sobrescribirla. Pero la regla no es sobre seguridad frente a colisiones: es sobre no reescribir historia firmada y ya publicada.

Si no se hace rebase, no surge la necesidad de forzar el push. Las dos reglas se sostienen la una a la otra.

Tampoco se utiliza `--no-verify`, que salta los hooks de pre-commit, incluido el de `gitleaks`.

## 10. Actualizar una feature branch

Cuando `main` avanza y una rama en curso necesita ponerse al día:

```bash
git fetch origin
git merge origin/main
```

Genera un commit de fusión en la rama. Es coherente con la sección 6 y no reescribe nada.

La alternativa por rebase queda descartada por la sección 8.

Para que un `git pull` distraído no rebase por su cuenta hace falta configurarlo en cada máquina. Ese comando vive en la guía de instalación, `docs/guia-instalacion.md`, junto al resto de configuración que no se versiona.

## 11. Principios resumidos

```text
                 ┌──────────────┐
                 │     main     │
                 │  PROTEGIDA   │
                 └──────┬───────┘
                        │
                 crear rama feat/
                        │
          ┌─────────────┴─────────────┐
          │                           │
    feat/login                  feat/payment
   propietario A                propietario B
   commits atómicos             commits atómicos
          │                           │
          └─────────────┬─────────────┘
                        │
                    Pull Request
                        │
                 Code Review + CI
                        │
                   Merge Commit
                  (firmas intactas)
                        │
                        ▼
                      main
```

### Reglas principales

1. **No trabajar directamente sobre** `main`.

2. **Prefijos válidos:** `feat/`, `fix/`, `chore/`, `docs/`. `feature/` **no vale.**

3. **Una rama tiene un único responsable.**

4. **Los cambios llegan a** `main` **mediante Pull Request.**

5. `main` **está protegida por ruleset contra push directo y force-push.**

6. **La estrategia de integración es Merge Commit, para preservar las firmas.**

7. **Los commits son atómicos desde el principio, porque no hay limpieza posterior.**

8. **El cuerpo del mensaje es obligatorio en los merge commits.**

9. **No se hace rebase.**

10. **No se hace force push, ni siquiera con** `--force-with-lease`.

11. **Las ramas se actualizan desde** `main` **con** `git merge`.

12. **Los commits van firmados. No se usa** `--no-verify`.

### Si algo aquí queda corto

Este documento explica. `AGENTS.md` obliga. Ante una duda que ninguno de los dos resuelva, se pregunta antes de escribir.
