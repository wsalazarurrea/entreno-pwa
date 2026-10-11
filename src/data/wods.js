/* WOD de referencia de CrossFit ("Girls", "Heroes" y clásicos) listos para usar.
   Cargas Rx en kg (hombres/mujeres), convertidas de las libras originales.
   mode: "amrap" (máximas rondas en capSec), "fortime" (por tiempo, límite capSec)
   o "intervals" (fases fijas, como EMOM o Tabata). */

let n = 0;
const sid = () => `wod-step-${++n}`;
const st = (name, sec, kind = "work") => ({ id: sid(), name, sec, kind });

const amrap = (id, name, min, workout, notes = "") =>
  ({ id, name, mode: "amrap", capSec: min * 60, warmup: 10, cooldown: 0, workout, notes, steps: [], rounds: 1, restRounds: 0, sets: 1, restSets: 0, skipLastRest: true });

const forTime = (id, name, capMin, workout, notes = "") =>
  ({ id, name, mode: "fortime", capSec: capMin * 60, warmup: 10, cooldown: 0, workout, notes, steps: [], rounds: 1, restRounds: 0, sets: 1, restSets: 0, skipLastRest: true });

const intervals = (id, name, steps, rounds, workout, notes = "", extra = {}) =>
  ({ id, name, mode: "intervals", warmup: 10, cooldown: 0, workout, notes, steps, rounds, restRounds: 0, sets: 1, restSets: 0, skipLastRest: true, ...extra });

export const WOD_LIBRARY = [
  amrap("wod-cindy", "Cindy", 20, ["5 dominadas", "10 flexiones", "15 sentadillas"]),
  amrap("wod-mary", "Mary", 20, ["5 flexiones de pino (HSPU)", "10 sentadillas pistol alternadas", "15 dominadas"]),
  amrap("wod-nicole", "Nicole", 20, ["Correr 400 m", "Máximas dominadas"], "Anota las dominadas de cada ronda."),
  forTime("wod-fran", "Fran", 10, ["21-15-9 de:", "Thrusters", "Dominadas"], "Rx: 43/29 kg"),
  forTime("wod-grace", "Grace", 10, ["30 cargadas y envión (clean & jerk)"], "Rx: 61/43 kg"),
  forTime("wod-isabel", "Isabel", 10, ["30 arrancadas (snatch)"], "Rx: 61/43 kg"),
  forTime("wod-helen", "Helen", 20, ["3 rondas de:", "Correr 400 m", "21 swings con kettlebell", "12 dominadas"], "Rx: kettlebell 24/16 kg"),
  forTime("wod-diane", "Diane", 10, ["21-15-9 de:", "Peso muerto", "Flexiones de pino (HSPU)"], "Rx: 102/70 kg"),
  forTime("wod-elizabeth", "Elizabeth", 15, ["21-15-9 de:", "Cargadas (clean)", "Fondos en anillas"], "Rx: 61/43 kg"),
  forTime("wod-annie", "Annie", 15, ["50-40-30-20-10 de:", "Saltos dobles de cuerda", "Abdominales (sit-ups)"]),
  forTime("wod-karen", "Karen", 15, ["150 lanzamientos de balón a la pared (wall balls)"], "Rx: balón 9/6 kg a 3/2,7 m"),
  forTime("wod-angie", "Angie", 30, ["100 dominadas", "100 flexiones", "100 abdominales", "100 sentadillas"], "En orden: termina cada movimiento antes de pasar al siguiente."),
  forTime("wod-jackie", "Jackie", 15, ["Remo 1.000 m", "50 thrusters", "30 dominadas"], "Rx: barra 20/15 kg"),
  forTime("wod-nancy", "Nancy", 25, ["5 rondas de:", "Correr 400 m", "15 sentadillas overhead"], "Rx: 43/29 kg"),
  forTime("wod-kelly", "Kelly", 40, ["5 rondas de:", "Correr 400 m", "30 saltos al cajón", "30 wall balls"], "Rx: cajón 60/50 cm · balón 9/6 kg"),
  forTime("wod-dt", "DT", 15, ["5 rondas de:", "12 pesos muertos", "9 cargadas de potencia colgantes", "6 enviones de empuje (push jerk)"], "Rx: 70/47 kg"),
  forTime("wod-murph", "Murph", 75, ["Correr 1,6 km", "100 dominadas", "200 flexiones", "300 sentadillas", "Correr 1,6 km"], "Rx: con chaleco 9/6 kg. Puedes repartir dominadas, flexiones y sentadillas como quieras."),
  intervals("wod-chelsea", "Chelsea", [st("Minuto", 60)], 30,
    ["Cada minuto, durante 30 minutos:", "5 dominadas", "10 flexiones", "15 sentadillas"], "Si no completas la ronda dentro del minuto, se acaba el WOD."),
  intervals("wod-chief", "The Chief", [st("AMRAP 3 min", 180), st("Descanso", 60, "rest")], 5,
    ["5 ciclos de AMRAP 3 min (1 min de descanso entre ciclos):", "3 cargadas de potencia", "6 flexiones", "9 sentadillas"], "Rx: 61/43 kg"),
  intervals("wod-fgb", "Fight Gone Bad",
    [st("Wall balls", 60), st("Peso muerto sumo + jalón alto", 60), st("Saltos al cajón", 60), st("Press de empuje (push press)", 60), st("Remo (calorías)", 60), st("Descanso", 60, "rest")], 3,
    ["3 rondas, 1 minuto en cada estación:", "Wall balls", "Peso muerto sumo con jalón alto", "Saltos al cajón", "Push press", "Remo (calorías)", "1 minuto de descanso"], "Rx: balón 9/6 kg · barra 34/25 kg · cajón 50 cm. Cuenta 1 punto por repetición."),
  intervals("wod-tabata-se", "Tabata Something Else", [st("Trabajo", 20), st("Descanso", 10, "rest")], 32,
    ["Tabata (20 s trabajo / 10 s descanso), 8 rondas de cada uno, sin pausa entre ellos:", "Dominadas", "Flexiones", "Abdominales", "Sentadillas"], "Anota tus repeticiones de cada ronda."),
];

export const WOD_MODE_LABEL = { amrap: "AMRAP", fortime: "Por tiempo", intervals: "Intervalos" };
