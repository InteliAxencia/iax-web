// Patrón de correo único para el servidor y para el atributo pattern de los
// formularios (decisión 43). Es el de z.email() con el guion final de la
// última clase escapado: el navegador compila pattern con el flag v, que no
// admite un guion sin escapar dentro de una clase. Sin el flag v, escapado o
// no, acepta lo mismo. Rechaza a@b.c, igual que el servidor.
//
// Va sin anclas porque el navegador envuelve pattern en ^(?:...)$. El servidor
// compila la misma expresión con las mismas anclas y el mismo flag, así que
// los dos lados evalúan exactamente lo mismo. Este archivo no importa nada,
// para que los componentes lo usen sin cargar astro:env.
export const PATRON_CORREO = String.raw`(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+\-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}`;

export const EXPRESION_CORREO = new RegExp(`^(?:${PATRON_CORREO})$`, "v");
