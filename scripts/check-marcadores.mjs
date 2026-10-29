// Comprueba que ningun marcador de equis llega a produccion.
// Se ejecuta en Workers Builds detras del build:
//   npm run build && node scripts/check-marcadores.mjs
// No puede ir en verify: alli ID_FISCAL no existe y el marcador esta siempre.
// Falla en cerrado: si no hay paginas que recorrer, tambien es un error,
// porque un verde significaria que no se ha comprobado ninguna.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const DIRECTORIO = "dist/client";
const MARCADOR = /X{4,}/;

if (!existsSync(DIRECTORIO)) {
  console.error(`Marcadores: no existe ${DIRECTORIO}.`);
  console.error("Falta el build o ha cambiado la carpeta de salida.");
  process.exit(1);
}

const paginas = readdirSync(DIRECTORIO, { recursive: true })
  .filter((ruta) => ruta.endsWith(".html"))
  .map((ruta) => join(DIRECTORIO, ruta))
  .sort();

if (paginas.length === 0) {
  console.error(`Marcadores: ningun .html en ${DIRECTORIO}.`);
  console.error("Ha cambiado la salida del build.");
  process.exit(1);
}

const conMarcador = paginas.filter((ruta) =>
  MARCADOR.test(readFileSync(ruta, "utf8")),
);

if (conMarcador.length > 0) {
  console.error("Marcadores sin rellenar en:");
  for (const ruta of conMarcador) console.error(`  - ${ruta}`);
  console.error("");
  console.error("Revisa las variables de compilacion en docs/despliegue.md.");
  process.exit(1);
}

console.log(`Marcadores: ${paginas.length} paginas, ninguna con marcador.`);
