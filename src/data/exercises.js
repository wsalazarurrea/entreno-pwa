/* Catálogo de ejercicios al estilo Hevy (nombres "Ejercicio (Equipo)").
   Incluye tal cual los nombres que ya aparecen en tu historial de Hevy, para
   que queden enlazados con tus registros. Los ejercicios personalizados que
   crees en la app se guardan en state.customExercises y se suman a esta lista. */

export const MUSCLES = [
  "Pecho", "Dorsales", "Espalda alta", "Espalda baja", "Trapecio", "Hombros",
  "Bíceps", "Tríceps", "Antebrazos", "Cuádriceps", "Isquiotibiales", "Glúteos",
  "Aductores", "Abductores", "Pantorrillas", "Abdominales", "Cardio", "Cuerpo completo", "Otro",
];

export const EQUIPMENT = [
  "Barra", "Mancuerna", "Máquina", "Cable", "Peso corporal", "Kettlebell", "Disco", "Banda", "Otro",
];

// [nombre, equipo] agrupados por músculo principal.
const RAW = {
  "Pecho": [
    ["Press de Banca (Barra)", "Barra"],
    ["Press de Banca (Mancuerna)", "Mancuerna"],
    ["Press de Banca (Máquina Smith)", "Máquina"],
    ["Press de Banca Inclinado (Barra)", "Barra"],
    ["Press de Banca Inclinado (Mancuerna)", "Mancuerna"],
    ["Press de Banca Inclinado (Máquina Smith)", "Máquina"],
    ["Press de Banca Declinado (Barra)", "Barra"],
    ["Press de Banca Declinado (Mancuerna)", "Mancuerna"],
    ["Press de Pecho (Máquina)", "Máquina"],
    ["Press de Pecho Inclinado (Máquina)", "Máquina"],
    ["Press de Pecho Iso-Lateral (Máquina)", "Máquina"],
    ["Press de Pecho de Pie (Cable)", "Cable"],
    ["Press de Pecho (Banda)", "Banda"],
    ["Aperturas (Mancuerna)", "Mancuerna"],
    ["Aperturas Inclinadas (Mancuerna)", "Mancuerna"],
    ["Aperturas (Máquina)", "Máquina"],
    ["Aperturas de Pecho Sentado (Cable)", "Cable"],
    ["Aperturas de Abajo hacia Arriba (Cable)", "Cable"],
    ["Aperturas de Arriba hacia Abajo (Cable)", "Cable"],
    ["Cables Cruzados", "Cable"],
    ["Pullover (Mancuerna)", "Mancuerna"],
    ["Press Svend (Disco)", "Disco"],
    ["Fondos", "Peso corporal"],
    ["Fondos con Lastre", "Otro"],
    ["Fondos Asistidos (Máquina)", "Máquina"],
    ["Flexiones de Brazos", "Peso corporal"],
    ["Flexiones Inclinadas", "Peso corporal"],
    ["Flexiones Declinadas", "Peso corporal"],
  ],
  "Dorsales": [
    ["Dominada", "Peso corporal"],
    ["Dominada con Lastre", "Otro"],
    ["Dominada Supina", "Peso corporal"],
    ["Dominada Agarre Neutro", "Peso corporal"],
    ["Dominada Asistida (Máquina)", "Máquina"],
    ["Jalón al Pecho (Cable)", "Cable"],
    ["Jalón al Pecho (Máquina)", "Máquina"],
    ["Jalón al Pecho - Agarre Cerrado (Cable)", "Cable"],
    ["Jalón al Pecho Agarre Supino (Cable)", "Cable"],
    ["Jalón al Pecho a Un Brazo", "Cable"],
    ["Jalón de Remo a Un Brazo", "Cable"],
    ["Jalón con Brazos Rectos (Cable)", "Cable"],
    ["Pullover (Máquina)", "Máquina"],
  ],
  "Espalda alta": [
    ["Remo Inclinado (Barra)", "Barra"],
    ["Remo Pendlay (Barra)", "Barra"],
    ["Remo con Mancuerna", "Mancuerna"],
    ["Remo con Apoyo en Pecho (Mancuerna)", "Mancuerna"],
    ["Remo en Punta", "Máquina"],
    ["Remo en T (Barra)", "Barra"],
    ["Remo Sentado con Cable", "Cable"],
    ["Remo Sentado con Agarre en V (Cable)", "Cable"],
    ["Remo a Un Brazo (Cable)", "Cable"],
    ["Remo Sentado (Máquina)", "Máquina"],
    ["Remo Iso-Lateral", "Máquina"],
    ["Remo Bajo Iso-Lateral", "Máquina"],
    ["Remo Alto Iso-Lateral", "Máquina"],
    ["Remo Invertido", "Peso corporal"],
    ["Remo (Máquina Smith)", "Máquina"],
  ],
  "Espalda baja": [
    ["Peso Muerto (Barra)", "Barra"],
    ["Peso Muerto Sumo (Barra)", "Barra"],
    ["Peso Muerto (Mancuerna)", "Mancuerna"],
    ["Peso Muerto (Barra Hexagonal)", "Barra"],
    ["Peso Muerto Parcial (Barra)", "Barra"],
    ["Hiperextensión de Espalda", "Peso corporal"],
    ["Hiperextensión de Espalda con Peso", "Disco"],
    ["Superman", "Peso corporal"],
  ],
  "Trapecio": [
    ["Encogimientos (Barra)", "Barra"],
    ["Encogimientos (Mancuerna)", "Mancuerna"],
    ["Encogimientos (Máquina)", "Máquina"],
    ["Encogimientos (Cable)", "Cable"],
    ["Remo al Mentón (Barra)", "Barra"],
    ["Remo al Mentón (Cable)", "Cable"],
  ],
  "Hombros": [
    ["Press de Hombros (Barra)", "Barra"],
    ["Press Militar de Pie (Barra)", "Barra"],
    ["Press de Hombros (Mancuerna)", "Mancuerna"],
    ["Press de Hombros Sentado (Máquina)", "Máquina"],
    ["Press de Hombros (Máquina Smith)", "Máquina"],
    ["Press Arnold (Mancuerna)", "Mancuerna"],
    ["Press Landmine", "Barra"],
    ["Elevacion Laterales (Mancuerna)", "Mancuerna"],
    ["Elevación Lateral a un Brazo (Cable)", "Cable"],
    ["Elevación Lateral (Cable)", "Cable"],
    ["Elevación Lateral (Máquina)", "Máquina"],
    ["Elevación Lateral Inclinado (Mancuerna)", "Mancuerna"],
    ["Elevación Frontal (Mancuerna)", "Mancuerna"],
    ["Elevación Frontal (Cable)", "Cable"],
    ["Elevación Frontal (Barra)", "Barra"],
    ["Elevación Frontal con Disco", "Disco"],
    ["Vuelos Posteriores (Mancuerna)", "Mancuerna"],
    ["Vuelos Posteriores (Cable)", "Cable"],
    ["Vuelos Posteriores (Máquina)", "Máquina"],
    ["Tirón a la Cara", "Cable"],
    ["Elevación en Y (Mancuerna)", "Mancuerna"],
  ],
  "Bíceps": [
    ["Curl de Bíceps (Barra)", "Barra"],
    ["Curl de Bíceps (Mancuerna)", "Mancuerna"],
    ["Curl de Bíceps (Cable)", "Cable"],
    ["Curl de Bíceps (Máquina)", "Máquina"],
    ["Curl con Barra EZ", "Barra"],
    ["Curl Martillo (Mancuerna)", "Mancuerna"],
    ["Curl Martillo (Cable)", "Cable"],
    ["Curl de Bíceps Inclinado (Mancuerna)", "Mancuerna"],
    ["Curl predicador (máquina)", "Máquina"],
    ["Curl Predicador (Barra)", "Barra"],
    ["Curl Predicador (Mancuerna)", "Mancuerna"],
    ["Curl Concentrado (Mancuerna)", "Mancuerna"],
    ["Curl Araña (Mancuerna)", "Mancuerna"],
    ["Curl Zottman (Mancuerna)", "Mancuerna"],
    ["Curl de Biceps 21", "Barra"],
    ["Curl por detrás de la espalda (polea)", "Cable"],
    ["Curl de Bíceps en Polea Alta (Cable)", "Cable"],
    ["Curl Inverso (Barra)", "Barra"],
  ],
  "Tríceps": [
    ["Tríceps con Polea", "Cable"],
    ["Jalón de tríceps con cuerda", "Cable"],
    ["Extensión de tríceps en polea", "Cable"],
    ["Extensión de tríceps por encima de la cabeza (cable)", "Cable"],
    ["Extensión de Tríceps a un Brazo (Cable)", "Cable"],
    ["Extensión de Tríceps de un Brazo (Mancuerna)", "Mancuerna"],
    ["Extensión de Tríceps por Encima de la Cabeza (Mancuerna)", "Mancuerna"],
    ["Extensión de Tríceps (Máquina)", "Máquina"],
    ["Press Francés (Barra)", "Barra"],
    ["Press Francés (Mancuerna)", "Mancuerna"],
    ["Press de Banca Agarre Cerrado (Barra)", "Barra"],
    ["Patada de Tríceps (Mancuerna)", "Mancuerna"],
    ["Patada de Tríceps (Cable)", "Cable"],
    ["Fondo de Tríceps", "Peso corporal"],
    ["Fondos en Banco", "Peso corporal"],
    ["Fondos de Tríceps (Máquina)", "Máquina"],
    ["Flexiones Diamante", "Peso corporal"],
  ],
  "Antebrazos": [
    ["Curl de Muñeca (Barra)", "Barra"],
    ["Curl de Muñeca (Mancuerna)", "Mancuerna"],
    ["Curl de Muñeca Inverso (Barra)", "Barra"],
    ["Colgarse de la Barra", "Peso corporal"],
    ["Paseo del Granjero", "Mancuerna"],
  ],
  "Cuádriceps": [
    ["Sentadilla (Barra)", "Barra"],
    ["Sentadilla Frontal (Barra)", "Barra"],
    ["Sentadilla (Máquina Smith)", "Máquina"],
    ["Sentadilla Hack (Máquina)", "Máquina"],
    ["Sentadilla Péndulo (Máquina)", "Máquina"],
    ["Sentadilla en V (Máquina)", "Máquina"],
    ["Sentadilla Goblet (Mancuerna)", "Mancuerna"],
    ["Sentadilla Goblet (Kettlebell)", "Kettlebell"],
    ["Sentadilla Búlgara", "Mancuerna"],
    ["Sentadilla con Peso Corporal", "Peso corporal"],
    ["Sentadilla Sissy", "Peso corporal"],
    ["Press de Piernas", "Máquina"],
    ["Press de Piernas Horizontal (Máquina)", "Máquina"],
    ["Press de Piernas a Una Pierna (Máquina)", "Máquina"],
    ["Extensión de Pierna", "Máquina"],
    ["Extensión de Pierna a Una Pierna (Máquina)", "Máquina"],
    ["Zancada (Mancuerna)", "Mancuerna"],
    ["Zancada (Barra)", "Barra"],
    ["Zancada Caminando (Mancuerna)", "Mancuerna"],
    ["Zancada Inversa (Mancuerna)", "Mancuerna"],
    ["Zancada (Máquina Smith)", "Máquina"],
    ["Step con Mancuerna", "Mancuerna"],
  ],
  "Isquiotibiales": [
    ["Peso Muerto Rumano (Barra)", "Barra"],
    ["Peso Muerto Rumano (Mancuerna)", "Mancuerna"],
    ["Peso Muerto Rumano a Una Pierna (Mancuerna)", "Mancuerna"],
    ["Peso Muerto Piernas Rígidas (Barra)", "Barra"],
    ["Buenos Días (Barra)", "Barra"],
    ["Curl de Pierna Sentado", "Máquina"],
    ["Curl de Piernas Acostado (Máquina)", "Máquina"],
    ["Curl de Pierna de Pie (Máquina)", "Máquina"],
    ["Curl Nórdico", "Peso corporal"],
  ],
  "Glúteos": [
    ["Empuje de Caderas (Barra)", "Barra"],
    ["Empuje de Caderas (Máquina)", "Máquina"],
    ["Empuje de Caderas (Máquina Smith)", "Máquina"],
    ["Puente de Glúteos (Barra)", "Barra"],
    ["Puente de Glúteos", "Peso corporal"],
    ["Patada de Glúteo (Cable)", "Cable"],
    ["Patada de Burro (Máquina)", "Máquina"],
    ["Pull Through (Cable)", "Cable"],
    ["Hiperextensión para Glúteos", "Peso corporal"],
  ],
  "Aductores": [
    ["Aducción de Caderas", "Máquina"],
    ["Aducción de Cadera (Cable)", "Cable"],
    ["Sentadilla Sumo (Mancuerna)", "Mancuerna"],
  ],
  "Abductores": [
    ["Abducción de Caderas", "Máquina"],
    ["Abducción de Cadera (Cable)", "Cable"],
    ["Caminata Lateral con Banda", "Banda"],
  ],
  "Pantorrillas": [
    ["Elevación de Gemelos de Pie (Máquina)", "Máquina"],
    ["Elevación de Gemelos de Pie (Mancuerna)", "Mancuerna"],
    ["Elevación de Gemelos Sentado", "Máquina"],
    ["Elevación de Gemelos a Una Pierna (Barra)", "Barra"],
    ["Elevación de Gemelos (Máquina Smith)", "Máquina"],
    ["Elevación de Gemelos en Press de Piernas", "Máquina"],
    ["Elevación de Gemelos con Peso Corporal", "Peso corporal"],
    ["Extension de Pantorrilla (Máquina)", "Máquina"],
  ],
  "Abdominales": [
    ["Crunch", "Peso corporal"],
    ["Crunch (Máquina)", "Máquina"],
    ["Crunch con Cable", "Cable"],
    ["Crunch Inverso", "Peso corporal"],
    ["Crunch Bicicleta", "Peso corporal"],
    ["Abdominales (Sit Up)", "Peso corporal"],
    ["Abdominales en Banco Declinado", "Peso corporal"],
    ["Plancha", "Peso corporal"],
    ["Plancha Lateral", "Peso corporal"],
    ["Elevación de Piernas Colgado", "Peso corporal"],
    ["Elevación de Rodillas Colgado", "Peso corporal"],
    ["Elevación de Piernas Acostado", "Peso corporal"],
    ["Rueda Abdominal", "Otro"],
    ["Giro Ruso", "Peso corporal"],
    ["Leñador (Cable)", "Cable"],
    ["Pallof Press (Cable)", "Cable"],
    ["Escaladores", "Peso corporal"],
    ["Bicho Muerto", "Peso corporal"],
  ],
  "Cardio": [
    ["Cinta de Correr", "Máquina"],
    ["Bicicleta Estática", "Máquina"],
    ["Elíptica", "Máquina"],
    ["Remo Ergómetro", "Máquina"],
    ["Escaladora", "Máquina"],
    ["Saltar la Cuerda", "Otro"],
  ],
  "Cuerpo completo": [
    ["Burpees", "Peso corporal"],
    ["Swing con Kettlebell", "Kettlebell"],
    ["Cargada de Potencia (Barra)", "Barra"],
    ["Thruster (Barra)", "Barra"],
    ["Levantamiento Turco (Kettlebell)", "Kettlebell"],
  ],
};

export const EXERCISES = Object.entries(RAW).flatMap(([muscle, list]) =>
  list.map(([name, equipment]) => ({ name, muscle, equipment }))
);

const BY_NAME = new Map(EXERCISES.map(e => [e.name.toLowerCase(), e]));

/** Unidad sugerida a partir del equipo: mancuernas por mano, peso corporal sin carga. */
export function unitForEquipment(equipment){
  if (equipment === "Mancuerna") return "kg/mano";
  if (equipment === "Peso corporal") return "bw";
  return "kg";
}

/** Busca un ejercicio en el catálogo + personalizados (sin distinguir mayúsculas). */
export function findExercise(name, custom = []){
  if (!name) return null;
  const k = name.toLowerCase();
  return custom.find(c => c.name.toLowerCase() === k) || BY_NAME.get(k) || null;
}

/** Catálogo completo para el selector: base + personalizados + cualquier nombre
 * que ya exista en tu historial o rutinas aunque no esté en el catálogo. */
export function buildCatalog(custom = [], extraNames = []){
  const out = new Map();
  EXERCISES.forEach(e => out.set(e.name.toLowerCase(), e));
  custom.forEach(e => out.set(e.name.toLowerCase(), { ...e, custom: true }));
  extraNames.forEach(n => {
    const k = n.toLowerCase();
    if (!out.has(k)) out.set(k, { name: n, muscle: "Otro", equipment: "Otro" });
  });
  return [...out.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}
