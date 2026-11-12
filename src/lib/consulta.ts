import { z } from "astro/zod";
import { CORREO_DESTINO_CONTACTO, CORREO_REMITENTE } from "astro:env/server";
import { EXPRESION_CORREO } from "./correo";
import {
  EQUIPO,
  FORMULARIOS,
  HORARIO,
  MAXIMOS,
  PERFIL,
  type Pregunta,
  type TipoFormulario,
} from "./formularios";
import { enviarCorreo, type Resultado } from "./mailjet";

// Uno de los valores de una pregunta.
function opcion(pregunta: Pregunta) {
  return z.enum(pregunta.opciones.map((o) => o.valor) as [string, ...string[]]);
}

const libre = (maximo: number) => z.string().trim().max(maximo).optional();

// Campos comunes a los cuatro formularios. Prefijo y teléfono, con las mismas
// reglas que en contacto.ts.
const comunes = {
  nombre: z.string().trim().min(1).max(MAXIMOS.nombre),
  email: z.string().trim().max(254).regex(EXPRESION_CORREO),
  prefijo: z
    .string()
    .trim()
    .regex(/^(\+?\d{1,3})?$/)
    .transform((v) => (v && !v.startsWith("+") ? "+" + v : v))
    .optional(),
  telefono: z
    .string()
    .max(30)
    .transform((v) => v.replace(/ /g, ""))
    .pipe(z.string().regex(/^(\d{8,15})?$/))
    .optional(),
  organizacion: libre(MAXIMOS.organizacion),
  perfil: opcion(PERFIL).optional(),
  "perfil-otro": libre(MAXIMOS.otro),
  equipo: opcion(EQUIPO).optional(),
  "necesidad-otro": libre(MAXIMOS.otro),
  contexto: libre(MAXIMOS.contexto),
  horario: z.array(opcion(HORARIO)).max(HORARIO.opciones.length),
  // Campo trampa (docs/decisiones-reversibles.md, apartado 10).
  web: z.string().trim().optional(),
};

// Una variante por formulario: cambian las opciones de la pregunta
// obligatoria y, en formación, el nivel de experiencia.
function variante<T extends TipoFormulario>(tipo: T) {
  const { necesidad, experiencia } = FORMULARIOS[tipo];
  return z.object({
    ...comunes,
    tipo: z.literal(tipo),
    necesidad: z.array(opcion(necesidad)).min(1).max(necesidad.opciones.length),
    experiencia: experiencia ? opcion(experiencia) : z.undefined().optional(),
  });
}

export const esquemaConsulta = z
  .discriminatedUnion("tipo", [
    variante("general"),
    variante("diagnostico"),
    variante("formacion"),
    variante("soluciones-adaptadas"),
  ])
  .refine((d) => !d.telefono || Boolean(d.prefijo), { path: ["prefijo"] });

export type DatosConsulta = z.infer<typeof esquemaConsulta>;

// Convierte el cuerpo en el objeto que valida el esquema. La necesidad y el
// horario llegan como varias casillas con el mismo nombre: Object.fromEntries
// solo guardaría la última.
export function leerConsulta(cuerpo: FormData): Record<string, unknown> {
  return {
    ...Object.fromEntries(cuerpo),
    necesidad: cuerpo.getAll("necesidad"),
    horario: cuerpo.getAll("horario"),
  };
}

// Sin saltos de línea ni caracteres de control: el nombre va en el asunto y en
// ReplyTo, que son cabeceras del correo. Igual que en contacto.ts.
function enLinea(texto: string): string {
  return texto.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();
}

// Texto de la opción elegida. El de «Otro» se añade solo si esa opción está
// marcada: el campo oculto se envía igual aunque no lo esté.
function elegida(pregunta: Pregunta, valor?: string, otro?: string) {
  const o = pregunta.opciones.find((opcion) => opcion.valor === valor);
  return o && (o.otro && otro ? `${o.texto}: ${otro}` : o.texto);
}

const SIN_INDICAR = "sin indicar";

const dato = (etiqueta: string, valor?: string) =>
  `${etiqueta}: ${valor || SIN_INDICAR}`;

export function enviarConsulta(datos: DatosConsulta): Promise<Resultado> {
  // Se responde como si se hubiera enviado, para no delatar la comprobación.
  // El registro no lleva datos del formulario.
  if (datos.web) {
    console.warn(JSON.stringify({ origen: "consulta", motivo: "trampa" }));
    return Promise.resolve({ ok: true });
  }

  const f = FORMULARIOS[datos.tipo];
  const nombre = enLinea(datos.nombre);
  const telefono = datos.telefono && `${datos.prefijo} ${datos.telefono}`;
  const perfil = elegida(PERFIL, datos.perfil, datos["perfil-otro"]);
  const experiencia =
    f.experiencia && elegida(f.experiencia, datos.experiencia);

  const texto = [
    dato("Formulario", f.nombre),
    "",
    dato("Nombre", nombre),
    dato("Correo", datos.email),
    dato("Teléfono", telefono),
    dato("Organización", datos.organizacion),
    dato("Tipo de organización", perfil),
    dato("Tamaño del equipo", elegida(EQUIPO, datos.equipo)),
    dato(
      "Horario preferido",
      datos.horario.map((v) => elegida(HORARIO, v)).join(", "),
    ),
    ...(experiencia ? [dato("Nivel de experiencia", experiencia)] : []),
    "",
    f.necesidad.enunciado,
    ...datos.necesidad.map(
      (v) => `- ${elegida(f.necesidad, v, datos["necesidad-otro"])}`,
    ),
    "",
    f.contexto,
    datos.contexto || SIN_INDICAR,
  ].join("\n");

  return enviarCorreo({
    remitente: { correo: CORREO_REMITENTE, nombre: "Web inteliAxencia" },
    destinatario: { correo: CORREO_DESTINO_CONTACTO },
    responderA: { correo: datos.email, nombre },
    asunto: `Consulta web, ${f.nombre}: ${nombre}`,
    texto,
  });
}
