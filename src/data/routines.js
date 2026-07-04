/* Rutinas por defecto (semilla). Una vez sembradas en el estado, el usuario
   tiene libertad total para crear, editar, reordenar y borrar rutinas y
   ejercicios desde la app — nada de esto queda fijo en el código. */

export const ACCENTS = ["amber", "teal", "coral", "violet"];

export const UNITS = [
  { value: "kg", label: "kg" },
  { value: "kg/mano", label: "kg por mano" },
  { value: "kg/lado", label: "kg por lado" },
  { value: "bw", label: "Peso corporal" },
];

export function newId(prefix = "r") {
  return prefix + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export function blankExercise() {
  return { name: "", sets: 3, lo: 8, hi: 12, start: 20, unit: "kg", note: "" };
}

export function blankRoutine() {
  return { id: newId(), tag: "NUEVA", title: "", accent: "amber", ex: [blankExercise()] };
}

export function cloneRoutines(r) {
  return JSON.parse(JSON.stringify(r));
}

export const DEFAULT_ROUTINES = [
  { id: "SA", tag: "SUP A", title: "Pecho pesado", accent: "amber", ex: [
    { name: "Press de Banca Inclinado (Mancuerna)", sets: 4, lo: 6, hi: 9, start: 34, unit: "kg/mano", note: "Eccéntrico 3s, pausa abajo. Tu estrella." },
    { name: "Fondos", sets: 3, lo: 8, hi: 12, start: 0, unit: "bw", note: "Torso inclinado. Si pasas 12, añade lastre." },
    { name: "Aperturas (Máquina)", sets: 3, lo: 10, hi: 15, start: 72, unit: "kg", note: "Pec deck. Cerca del fallo." },
    { name: "Remo en Punta", sets: 3, lo: 10, hi: 12, start: 57, unit: "kg", note: "Apoyo de pecho. Mantenimiento." },
    { name: "Tirón a la Cara", sets: 3, lo: 15, hi: 15, start: 67, unit: "kg", note: "Salud de hombro. Innegociable." },
    { name: "Elevación Lateral a un Brazo (Cable)", sets: 3, lo: 12, hi: 15, start: 15, unit: "kg", note: "Sin balanceo." },
  ] },
  { id: "IA", tag: "INF A", title: "Cuádriceps", accent: "teal", ex: [
    { name: "Sentadilla Hack (Máquina)", sets: 4, lo: 8, hi: 10, start: 100, unit: "kg", note: "Ya hiciste 100×9 y 110×6." },
    { name: "Press de Piernas", sets: 3, lo: 10, hi: 12, start: 190, unit: "kg", note: "Vienes de 200×10." },
    { name: "Extensión de Pierna", sets: 3, lo: 12, hi: 15, start: 90, unit: "kg", note: "Para llegar de verdad a 15." },
    { name: "Curl de Pierna Sentado", sets: 3, lo: 10, hi: 12, start: 78, unit: "kg", note: "Lo has hecho hasta 90 kg." },
    { name: "Extension de Pantorrilla (Máquina)", sets: 4, lo: 10, hi: 12, start: 100, unit: "kg", note: "Pausa 1s abajo." },
  ] },
  { id: "SB", tag: "SUP B", title: "Pecho volumen", accent: "amber", ex: [
    { name: "Press de Banca (Mancuerna)", sets: 4, lo: 8, hi: 12, start: 32, unit: "kg/mano", note: "Baja hondo, siente el estiramiento." },
    { name: "Aperturas de Abajo hacia Arriba (Cable)", sets: 4, lo: 12, hi: 15, start: 11, unit: "kg/lado", note: "NUEVO. Pecho superior." },
    { name: "Aperturas de Arriba hacia Abajo (Cable)", sets: 3, lo: 12, hi: 15, start: 14, unit: "kg/lado", note: "Estiramiento pecho bajo." },
    { name: "Jalón al Pecho a Un Brazo", sets: 3, lo: 10, hi: 12, start: 55, unit: "kg", note: "Inicia con el dorsal." },
    { name: "Press de Hombros Sentado (Máquina)", sets: 2, lo: 10, hi: 12, start: 60, unit: "kg", note: "Mantenimiento." },
    { name: "Curl con Barra EZ", sets: 3, lo: 10, hi: 12, start: 35, unit: "kg", note: "" },
  ] },
  { id: "IB", tag: "INF B", title: "Glúteo / Femoral", accent: "teal", ex: [
    { name: "Empuje de Caderas (Barra)", sets: 4, lo: 8, hi: 12, start: 135, unit: "kg", note: "Estancado en 130. Rompe." },
    { name: "Peso Muerto Rumano (Barra)", sets: 3, lo: 10, hi: 12, start: 65, unit: "kg", note: "Bisagra de cadera. Ya hiciste 70×11." },
    { name: "Curl de Pierna Sentado", sets: 4, lo: 10, hi: 12, start: 78, unit: "kg", note: "" },
    { name: "Aducción de Caderas", sets: 2, lo: 12, hi: 15, start: 95, unit: "kg", note: "" },
    { name: "Abducción de Caderas", sets: 2, lo: 12, hi: 15, start: 95, unit: "kg", note: "" },
    { name: "Elevación de Gemelos Sentado", sets: 4, lo: 12, hi: 15, start: 45, unit: "kg", note: "Sóleo. Empieza conservador." },
  ] },
];
