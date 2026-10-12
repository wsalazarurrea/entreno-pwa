/* Rutinas del "Plan de definición 12 semanas" (documento del usuario), en su
   propio perfil. Se cargan una sola vez; después se editan como cualquier otra. */

import { newId } from "../routines.js";

export const PLAN_ID = "definicion-12";

const ex = (name, sets, lo, hi, start, unit, rest, note) => ({ name, sets, lo, hi, start, unit, rest, note });

export function buildDefinicion12(){
  const profile = { id: newId("pf"), name: "Definición 12 semanas" };
  const r = (tag, title, accent, list) => ({ id: newId("r"), profileId: profile.id, tag, title, accent, ex: list });
  const routines = [
    r("TOR A", "Torso A", "amber", [
      ex("Press de Banca (Barra)", 4, 6, 8, 77.5, "kg", 180, "RIR 2. La primera semana apunta a 6–7 reps por serie; cuando las 4 series lleguen a 8, sube a 80 kg."),
      ex("Dominada", 4, 6, 8, 0, "bw", 150, "RIR 2. Agarre prono o neutro."),
      ex("Press de Banca Inclinado (Mancuerna)", 3, 8, 10, 24, "kg/mano", 120, "RIR 2. Banco a 30°. Peso ≈"),
      ex("Remo Sentado con Agarre en V (Cable)", 3, 10, 12, 60, "kg", 120, "RIR 2. Agarre neutro. Peso ≈"),
      ex("Elevacion Laterales (Mancuerna)", 3, 12, 15, 9, "kg/mano", 75, "RIR 1–2. Peso ≈"),
      ex("Tirón a la Cara", 2, 15, 20, 20, "kg", 60, "RIR 2. Polea con cuerda. Peso ≈"),
      ex("Jalón de tríceps con cuerda", 2, 10, 12, 25, "kg", 90, "RIR 1–2. Superserie con el curl con barra EZ. Peso ≈"),
      ex("Curl con Barra EZ", 2, 10, 12, 30, "kg", 90, "RIR 1–2. Superserie con el tríceps en polea. Peso ≈"),
    ]),
    r("PIE A", "Pierna A", "teal", [
      ex("Sentadilla Hack (Máquina)", 4, 6, 8, 105, "kg", 180, "RIR 2."),
      ex("Curl de Pierna Sentado", 3, 8, 10, 45, "kg", 120, "RIR 2. Peso ≈"),
      ex("Press de Piernas", 3, 10, 12, 160, "kg", 150, "RIR 2. Prensa a 45°. Peso ≈"),
      ex("Hiperextensión de Espalda con Peso", 3, 10, 12, 10, "kg", 90, "RIR 2. A 45° con disco al pecho. Peso ≈"),
      ex("Elevación de Gemelos de Pie (Máquina)", 3, 10, 12, 80, "kg", 75, "RIR 1–2. Peso ≈"),
      ex("Rueda Abdominal", 3, 8, 12, 0, "bw", 60, "RIR 2."),
    ]),
    r("TOR B", "Torso B", "violet", [
      ex("Remo en Punta", 4, 8, 10, 50, "kg", 150, "RIR 2."),
      ex("Press Militar de Pie (Barra)", 3, 8, 10, 45, "kg", 150, "RIR 2–3, más reserva por el hombro derecho. Si molesta, cámbialo por press con mancuernas sentado, agarre neutro, ≈ 18 kg por mano."),
      ex("Jalón al Pecho (Cable)", 3, 10, 12, 65, "kg", 120, "RIR 2. Agarre neutro. Peso ≈"),
      ex("Press de Banca (Mancuerna)", 3, 10, 12, 26, "kg/mano", 120, "RIR 2. Peso ≈"),
      ex("Elevación Lateral a un Brazo (Cable)", 3, 12, 15, 7.5, "kg", 75, "RIR 1–2. Peso ≈"),
      ex("Vuelos Posteriores (Máquina)", 2, 12, 15, 35, "kg", 60, "RIR 2. Pec deck inverso. Peso ≈"),
      ex("Curl de Bíceps Inclinado (Mancuerna)", 2, 10, 12, 12, "kg/mano", 90, "RIR 1–2. Superserie con el tríceps sobre la cabeza en polea. Peso ≈"),
      ex("Extensión de tríceps por encima de la cabeza (cable)", 2, 10, 12, 20, "kg", 90, "RIR 1–2. Superserie con el curl inclinado. Peso ≈"),
    ]),
    r("PIE B", "Pierna B", "coral", [
      ex("Empuje de Caderas (Barra)", 4, 8, 10, 90, "kg", 150, "RIR 2. Peso ≈"),
      ex("Sentadilla Hack (Máquina)", 3, 10, 12, 90, "kg", 150, "RIR 2."),
      ex("Curl de Piernas Acostado (Máquina)", 3, 10, 12, 40, "kg", 120, "RIR 2. Peso ≈"),
      ex("Extensión de Pierna", 2, 12, 15, 50, "kg", 90, "RIR 1–2. Peso ≈"),
      ex("Elevación de Gemelos Sentado", 3, 12, 15, 40, "kg", 75, "RIR 1–2. Peso ≈"),
      ex("Elevación de Piernas Colgado", 3, 10, 12, 0, "bw", 60, "RIR 2."),
    ]),
  ];
  return { profile, routines };
}
