// R1: solo se admiten estas claves en wrangler.json.
// Lista blanca a proposito: falla en cerrado, asi que un producto nuevo de
// Cloudflare rompe la CI en lugar de colarse sin que nadie se entere.
// Anadir una clave aqui es una decision consciente y revisable en el diff.
import { readFileSync, existsSync } from "node:fs";

const PERMITIDAS = new Set([
  "$schema",
  "name",
  "compatibility_date",
  "compatibility_flags",
  "main",
  "assets",
  "observability",
  "vars",
  "routes",
  "workers_dev",
  "preview_urls",
  "keep_vars",
  "minify",
  "limits",
]);

const ARCHIVO = "wrangler.json";

if (!existsSync(ARCHIVO)) {
  console.log(`R1: ${ARCHIVO} no existe todavia, nada que comprobar.`);
  process.exit(0);
}

const config = JSON.parse(readFileSync(ARCHIVO, "utf8"));
const intrusas = Object.keys(config).filter((k) => !PERMITIDAS.has(k));

if (intrusas.length > 0) {
  console.error(`R1 incumplida: claves no permitidas en ${ARCHIVO}:`);
  for (const k of intrusas) console.error(`  - ${k}`);
  console.error("");
  console.error(
    "Si la clave es legitima, anadela a la lista de scripts/check-r1.mjs",
  );
  console.error("en el mismo pull request, para que quede en el diff.");
  process.exit(1);
}

console.log(`R1: ${Object.keys(config).length} claves, todas permitidas.`);
