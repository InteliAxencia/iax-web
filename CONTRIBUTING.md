# Cómo contribuir a iax-web

Esta es la puerta de entrada. Cuatro documentos más, por orden:

- **AGENTS.md** es la norma. Obliga. Si algo contradice a otro documento, manda este.
- **docs/guia-instalacion.md** explica cómo montar el entorno desde cero.
- **docs/politica-git.md** desarrolla el porqué de las reglas de Git.
- **docs/decisiones-reversibles.md** recoge qué decisiones pueden cambiar y qué las cambiaría.

## Antes del primer commit

Sigue la guía de instalación. Termina cuando puedas clonar, instalar, arrancar el servidor, hacer un commit firmado y verlo verificado.

## Ramas

Una rama por cambio, con un único responsable. Prefijos válidos: feat/, fix/, chore/, docs/. El prefijo feature/ no vale, el ruleset lo rechaza.

## Commits

Firmados y atómicos desde el principio, porque no hay limpieza posterior. El mensaje explica el porqué: si el contexto no se deduce del diff, va en el cuerpo.

Nunca se usa --no-verify, ni rebase, ni force push, ni reescritura de historial.

## Pull requests

Todo entra en main por pull request. La integración es siempre por commit de fusión: el aplastado y el rebase están desactivados porque destruyen la firma de los commits originales. El cuerpo del mensaje de fusión es obligatorio.

El check verify tiene que pasar antes de poder integrar.

## Antes de abrir el pull request

```bash
npm run format:check
npm run check
npm run build
```

Los tres tienen que pasar en local. Es lo mismo que hará la CI, así que fallar aquí te ahorra una vuelta.

## Qué comprueba la CI

El job verify ejecuta, en este orden:

1. **R1**: que wrangler.json solo contenga claves de la lista permitida en scripts/check-r1.mjs. Es lista blanca: cualquier clave nueva falla, y añadirla tiene que ser una decisión visible en el diff.
2. **R2**: que src/ no importe nada de cloudflare ni lea configuración del contexto del runtime.
3. Instalación sin ejecutar scripts, formato, validación de tipos y compilación.
4. **gitleaks**, con la misma versión que fija .pre-commit-config.yaml. Si cambias una, cambia la otra.

Las reglas R1 y R2 están explicadas en la sección 10 de AGENTS.md. No son preferencias: sostienen que cambiar de proveedor de alojamiento siga siendo una migración y no una reescritura.

## Dónde se ejecuta cada cosa

Git se ejecuta en el anfitrión, nunca dentro del contenedor: la clave de firma y el hook de pre-commit viven fuera a propósito. El desarrollo va dentro del Dev Container.

## Secretos

Nunca en el código, ni como valor de ejemplo ni comentado. En local van en .dev.vars, que está ignorado; el archivo .dev.vars.example lleva los nombres, nunca los valores. Cada clave nueva tiene que declararse también en el esquema de astro:env en astro.config.mjs.
