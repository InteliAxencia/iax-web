// Configuraciones de los formularios ampliados (WEBIAX-1, guion v0.3).
// Las leen las páginas, para pintar cada formulario, y src/lib/consulta.ts,
// para validar en el servidor: así una opción no puede existir en la página y
// faltar en el esquema. Sin importaciones.

export const TIPOS = [
  "general",
  "diagnostico",
  "formacion",
  "soluciones-adaptadas",
] as const;

export type TipoFormulario = (typeof TIPOS)[number];

export interface Opcion {
  // Lo que se envía en el formulario. No se muestra.
  valor: string;
  // Lo que se muestra y lo que llega en el aviso a info@.
  texto: string;
  // La opción «Otro», que lleva un campo de texto.
  otro?: boolean;
}

export interface Pregunta {
  nombre: string;
  enunciado: string;
  opciones: readonly Opcion[];
}

export interface Formulario {
  tipo: TipoFormulario;
  ruta: string;
  // Nombre del formulario en el asunto del aviso a info@.
  nombre: string;
  titulo: string;
  tituloPagina: string;
  descripcion: string;
  intro: string;
  // Título del bloque 3, el de la pregunta obligatoria.
  bloqueNecesidad: string;
  // Casillas múltiples, al menos una marcada.
  necesidad: Pregunta;
  // Opción única y obligatoria. Solo en formación.
  experiencia?: Pregunta;
  // Enunciado del campo abierto del bloque 4.
  contexto: string;
}

// Longitudes máximas, comunes al marcado y al esquema.
export const MAXIMOS = {
  nombre: 200,
  organizacion: 200,
  otro: 200,
  contexto: 5000,
} as const;

export const AVISO_CAMPO_ABIERTO =
  "No incluyas datos de tus clientes ni información confidencial.";

export const PERFIL: Pregunta = {
  nombre: "perfil",
  enunciado: "¿Desde qué tipo de organización nos contactas?",
  opciones: [
    { valor: "despacho", texto: "Despacho de abogados" },
    { valor: "asesoria", texto: "Asesoría o graduado social" },
    { valor: "departamento", texto: "Departamento laboral o de RRHH" },
    { valor: "colegio", texto: "Colegio u organización profesional" },
    { valor: "otro", texto: "Otro", otro: true },
  ],
};

export const EQUIPO: Pregunta = {
  nombre: "equipo",
  enunciado: "¿Cuántas personas forman parte de tu equipo?",
  opciones: [
    { valor: "independiente", texto: "Soy profesional independiente" },
    { valor: "de-2-a-5", texto: "De 2 a 5" },
    { valor: "de-6-a-10", texto: "De 6 a 10" },
    { valor: "mas-de-10", texto: "Más de 10" },
  ],
};

export const HORARIO: Pregunta = {
  nombre: "horario",
  enunciado: "¿En qué horario prefieres que te contactemos?",
  opciones: [
    { valor: "9-11", texto: "De 9:00 a 11:00" },
    { valor: "11-13", texto: "De 11:00 a 13:00" },
    { valor: "13-15", texto: "De 13:00 a 15:00" },
    { valor: "15-17", texto: "De 15:00 a 17:00" },
    { valor: "17-19", texto: "De 17:00 a 19:00" },
    { valor: "indiferente", texto: "Me es indiferente" },
  ],
};

export const ENUNCIADO_CONTACTO = "¿Cómo podemos contactar contigo?";

export const FORMULARIOS: Record<TipoFormulario, Formulario> = {
  general: {
    tipo: "general",
    ruta: "/contacto",
    nombre: "General",
    titulo: "Cuéntanos qué necesitas mejorar",
    tituloPagina: "Cuéntanos qué necesitas mejorar · inteliAxencia",
    descripcion:
      "Cuéntanos qué necesitas mejorar en tu forma de trabajar. Te responderemos en un máximo de dos días laborables.",
    intro:
      "Unas pocas preguntas para entender tu situación y saber cómo podemos ayudarte.",
    bloqueNecesidad: "Necesidad",
    necesidad: {
      nombre: "necesidad",
      enunciado: "¿Qué te gustaría mejorar en tu forma de trabajar?",
      opciones: [
        { valor: "tareas", texto: "Reducir tareas administrativas" },
        {
          valor: "procesos",
          texto: "Optimizar procesos y flujos de trabajo",
        },
        {
          valor: "herramientas-actuales",
          texto: "Sacarle más partido a las herramientas que ya utilizo",
        },
        {
          valor: "herramientas-nuevas",
          texto: "Incorporar herramientas nuevas",
        },
        { valor: "aprender-ia", texto: "Aprender a utilizar mejor la IA" },
        {
          valor: "control-datos",
          texto: "Trabajar con IA manteniendo el control sobre los datos",
        },
        { valor: "formar-equipo", texto: "Formar a mi equipo" },
        {
          valor: "no-lo-se",
          texto: "No tengo claro qué necesito; quiero analizar mi situación",
        },
        { valor: "otro", texto: "Otro", otro: true },
      ],
    },
    contexto:
      "¿Hay algún proceso o tarea concreta que te esté dando problemas?",
  },
  diagnostico: {
    tipo: "diagnostico",
    ruta: "/contacto/diagnostico",
    nombre: "Diagnóstico y optimización",
    titulo: "Diagnóstico y optimización",
    tituloPagina: "Diagnóstico y optimización · inteliAxencia",
    descripcion:
      "Pide un diagnóstico de cómo trabaja tu equipo: procesos, tareas y herramientas que se pueden mejorar.",
    intro:
      "Cuéntanos cómo trabaja tu equipo. Unas pocas preguntas para entender tu situación actual y ver juntos qué se puede mejorar.",
    bloqueNecesidad: "Qué te gustaría analizar",
    necesidad: {
      nombre: "necesidad",
      enunciado: "¿Qué te gustaría analizar?",
      opciones: [
        { valor: "procesos", texto: "Procesos y tareas del día a día" },
        {
          valor: "herramientas-actuales",
          texto:
            "Herramientas que ya utilizamos, para ver si las estamos aprovechando",
        },
        {
          valor: "herramientas-nuevas",
          texto: "Posibles herramientas nuevas que puedan aportar valor",
        },
        {
          valor: "friccion",
          texto: "Puntos de fricción o tareas repetitivas",
        },
        {
          valor: "no-lo-se",
          texto: "Aún no lo sé, quiero que me ayuden a verlo",
        },
        { valor: "otro", texto: "Otro", otro: true },
      ],
    },
    contexto:
      "¿Hay alguna tarea o proceso concreto que te esté generando dificultades?",
  },
  formacion: {
    tipo: "formacion",
    ruta: "/contacto/formacion",
    nombre: "Formación y acompañamiento",
    titulo: "Formación y acompañamiento",
    tituloPagina: "Formación y acompañamiento · inteliAxencia",
    descripcion:
      "Pide una formación en herramientas de IA adaptada al nivel y a la forma de trabajar de tu equipo.",
    intro:
      "Cuéntanos qué necesita tu equipo. Unas pocas preguntas para diseñar una formación adaptada a su nivel y a su forma de trabajar.",
    bloqueNecesidad: "Necesidad de formación",
    necesidad: {
      nombre: "necesidad",
      enunciado: "¿En qué te gustaría que se centre la formación?",
      opciones: [
        { valor: "uso-practico", texto: "Uso práctico de herramientas de IA" },
        {
          valor: "herramienta-nueva",
          texto: "Incorporación de una herramienta nueva",
        },
        {
          valor: "buenas-practicas",
          texto: "Buenas prácticas de uso de la IA",
        },
        {
          valor: "procesos",
          texto: "Adaptar la formación a nuestros procesos concretos",
        },
        {
          valor: "acompanamiento",
          texto: "Acompañamiento durante la puesta en marcha",
        },
        { valor: "otro", texto: "Otro", otro: true },
      ],
    },
    experiencia: {
      nombre: "experiencia",
      enunciado:
        "¿Cómo describirías el nivel de experiencia de tu equipo con herramientas de IA?",
      opciones: [
        { valor: "ninguna", texto: "Sin experiencia previa" },
        { valor: "basico", texto: "Nivel básico" },
        { valor: "intermedio", texto: "Nivel intermedio" },
        { valor: "avanzado", texto: "Nivel avanzado" },
      ],
    },
    contexto:
      "¿Hay algo concreto que te gustaría que tu equipo aprendiera a hacer con estas herramientas?",
  },
  "soluciones-adaptadas": {
    tipo: "soluciones-adaptadas",
    ruta: "/contacto/soluciones-adaptadas",
    nombre: "Soluciones adaptadas",
    titulo: "Soluciones adaptadas",
    tituloPagina: "Soluciones adaptadas · inteliAxencia",
    descripcion:
      "Cuéntanos qué necesitas resolver y vemos si podemos ayudarte con una solución adaptada.",
    intro:
      "Cuéntanos qué necesitas resolver. Unas pocas preguntas para entender tu situación y ver si podemos ayudarte con una solución adaptada.",
    bloqueNecesidad: "Necesidad",
    necesidad: {
      nombre: "necesidad",
      enunciado: "¿Qué tipo de ayuda estás buscando?",
      opciones: [
        {
          valor: "evaluar",
          texto: "Evaluar herramientas que ya existen en el mercado",
        },
        {
          valor: "integrar",
          texto: "Integrar entre sí herramientas que ya utilizamos",
        },
        {
          valor: "configurar",
          texto: "Configurar una herramienta para un uso concreto",
        },
        {
          valor: "a-medida",
          texto: "Desarrollar algo a medida para una necesidad específica",
        },
        { valor: "ia-local", texto: "Explorar una solución de IA local" },
        {
          valor: "no-lo-se",
          texto: "No lo tengo claro, necesito que me ayuden a verlo",
        },
        { valor: "otro", texto: "Otro", otro: true },
      ],
    },
    contexto: "¿Qué estás usando actualmente y qué no logra resolver?",
  },
};
