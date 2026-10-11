/* Guías de los WOD de referencia (src/data/wods.js): cómo se juegan, estrategia,
   escalado en 3 niveles y referencias orientativas (varían según la fuente).
   moves: familias de técnica (src/data/technique.js) para ver cada movimiento. */

export const WOD_GUIDES = {
  "wod-cindy": {
    how: "AMRAP de 20 minutos: repite la ronda (5 dominadas, 10 flexiones, 15 sentadillas) tantas veces como puedas. Tu resultado son las rondas completas más las repeticiones de la ronda incompleta.",
    strategy: "Las flexiones suelen ser el cuello de botella: divídelas desde el principio (por ejemplo 5+5). Busca un ritmo de ~1 ronda por minuto que puedas sostener los 20 minutos.",
    scale: { b: "Dominadas con banda o remo invertido · flexiones con rodillas o inclinadas · sentadilla a un cajón.", n: "Dominadas con salto o banda liviana · flexiones completas.", a: "Rx: dominadas estrictas o con kipping, flexiones con pecho al suelo." },
    ref: "Principiante 8–12 rondas · intermedio 13–17 · avanzado 18–22 · élite 23+.",
    moves: ["dominada", "flexiones", "sentadilla"] },
  "wod-mary": {
    how: "AMRAP de 20 minutos de 5 flexiones de pino (HSPU), 10 sentadillas pistol alternadas y 15 dominadas. Es un 'Cindy' de gimnasia avanzada.",
    strategy: "Las HSPU y las pistol se fatigan rápido: haz series cortas desde el principio y no llegues al fallo en las primeras rondas.",
    scale: { b: "Press de hombros con mancuernas · zancadas o sentadilla a un cajón · remo invertido.", n: "HSPU con cojines o pike push-ups · pistol a un cajón · dominadas con banda.", a: "Rx: HSPU a la cabeza, pistol completas, dominadas." },
    ref: "Principiante 4–6 rondas · intermedio 7–10 · avanzado 11–15 · élite 16+.",
    moves: ["hspu", "sentadilla-pistol", "dominada"] },
  "wod-nicole": {
    how: "AMRAP de 20 minutos: corre 400 m y luego haz el máximo de dominadas que puedas sin bajarte. Anota las dominadas de cada ronda: tu resultado es el total.",
    strategy: "Corre a un ritmo cómodo: el puntaje lo dan las dominadas. Bájate de la barra uno o dos antes del fallo para no destruirte en las primeras rondas.",
    scale: { b: "Caminar/trotar 200 m · remo invertido o dominadas con banda.", n: "Correr 400 m · dominadas con banda liviana o con salto.", a: "Rx: 400 m y dominadas (con kipping permitido)." },
    ref: "Principiante <40 dominadas · intermedio 50–90 · avanzado 100–140 · élite 150+.",
    moves: ["correr", "dominada"] },
  "wod-fran": {
    how: "Por tiempo: 21 thrusters + 21 dominadas, 15 + 15, 9 + 9. Cronómetro hacia arriba; toca «Terminé» al acabar.",
    strategy: "Es un sprint muy intenso. Intenta los 21 thrusters en 2 bloques (por ejemplo 11+10) y descansos muy cortos. No te sientes a descansar.",
    scale: { b: "Thruster con barra vacía o mancuernas livianas · remo invertido o dominadas con banda.", n: "Thruster 30/20 kg · dominadas con banda o con salto.", a: "Rx: thruster 43/29 kg · dominadas." },
    ref: "Principiante 8–12 min · intermedio 5–8 · avanzado 3–5 · élite <3.",
    moves: ["thruster", "dominada"] },
  "wod-grace": {
    how: "Por tiempo: 30 cargadas y envión (clean & jerk), desde el suelo hasta sobre la cabeza en cada repetición.",
    strategy: "Con peso Rx casi todos hacen singles (una repetición y soltar). Busca un ritmo constante, por ejemplo 1 repetición cada 5–8 segundos.",
    scale: { b: "Barra vacía o mancuerna a un brazo · power clean + push press.", n: "40/30 kg.", a: "Rx: 61/43 kg." },
    ref: "Principiante 6–8 min · intermedio 4–6 · avanzado 2–4 · élite <2.",
    moves: ["cargada", "envion"] },
  "wod-isabel": {
    how: "Por tiempo: 30 arrancadas (snatch), desde el suelo hasta sobre la cabeza en un solo movimiento.",
    strategy: "Igual que Grace: singles rápidos y constantes. La técnica es lo primero; con fatiga baja el peso antes que perder la forma.",
    scale: { b: "Arrancada con mancuerna o kettlebell, o barra vacía.", n: "35/25 kg (power snatch).", a: "Rx: 61/43 kg." },
    ref: "Principiante 7–9 min · intermedio 4–7 · avanzado 2–4 · élite <2.",
    moves: ["arrancada"] },
  "wod-helen": {
    how: "3 rondas por tiempo de: correr 400 m, 21 swings con kettlebell (americano, sobre la cabeza) y 12 dominadas.",
    strategy: "Haz los 21 swings sin parar o en 2 bloques. Las carreras sirven para recuperar: ritmo firme pero sostenible.",
    scale: { b: "Caminar/trotar 200 m · swing ruso 12/8 kg · remo invertido.", n: "Correr 400 m · swing 16/12 kg · dominadas con banda.", a: "Rx: 24/16 kg · dominadas." },
    ref: "Principiante 13–16 min · intermedio 10–13 · avanzado 8–10 · élite <8.",
    moves: ["correr", "swing-kb", "dominada"] },
  "wod-diane": {
    how: "Por tiempo: 21 pesos muertos + 21 flexiones de pino (HSPU), 15 + 15, 9 + 9.",
    strategy: "El peso muerto pesado fatiga la espalda: mantén la técnica impecable. Divide las HSPU en series cortas desde el principio.",
    scale: { b: "Peso muerto 40/30 kg · press de hombros con mancuernas o pike push-ups.", n: "Peso muerto 70/50 kg · HSPU con cojines.", a: "Rx: 102/70 kg · HSPU." },
    ref: "Principiante 8–12 min · intermedio 5–8 · avanzado 3–5 · élite <3.",
    moves: ["peso-muerto", "hspu"] },
  "wod-elizabeth": {
    how: "Por tiempo: 21 cargadas (squat clean) + 21 fondos en anillas, 15 + 15, 9 + 9.",
    strategy: "Las cargadas pueden ser series de toques rápidos (touch and go) si la técnica aguanta. Los fondos en anillas se fatigan rápido: divide.",
    scale: { b: "Cargada con barra vacía o mancuernas · fondos en banco o flexiones.", n: "Cargada 40/30 kg · fondos en paralelas o asistidos.", a: "Rx: 61/43 kg · fondos en anillas." },
    ref: "Principiante 10–14 min · intermedio 7–10 · avanzado 4–7 · élite <4.",
    moves: ["cargada", "fondos-anillas"] },
  "wod-annie": {
    how: "Por tiempo: 50 saltos dobles de cuerda + 50 abdominales, 40 + 40, 30 + 30, 20 + 20, 10 + 10.",
    strategy: "Si dominas los saltos dobles, haz series largas; si se te traban, toma pausas cortas y retoma. Los abdominales a ritmo constante.",
    scale: { b: "Saltos simples (el doble: 100-80-60-40-20) · crunch.", n: "Mezcla de dobles y simples · sit-up con abmat.", a: "Rx: saltos dobles · sit-ups." },
    ref: "Principiante 12–15 min · intermedio 9–12 · avanzado 7–9 · élite <7.",
    moves: ["cuerda", "sit-up"] },
  "wod-karen": {
    how: "Por tiempo: 150 lanzamientos de balón a la pared (wall balls).",
    strategy: "Elige bloques que puedas repetir, por ejemplo 15 × 10 con descansos de 3–5 respiraciones. No pares mucho rato: el descanso largo es lo que más tiempo cuesta.",
    scale: { b: "75–100 repeticiones · balón 4/3 kg · blanco más bajo.", n: "150 · balón 6/4 kg.", a: "Rx: 150 · balón 9/6 kg a 3/2,7 m." },
    ref: "Principiante 11–14 min · intermedio 8–11 · avanzado 6–8 · élite <6.",
    moves: ["wall-ball", "sentadilla"] },
  "wod-angie": {
    how: "Por tiempo: 100 dominadas, luego 100 flexiones, luego 100 abdominales y luego 100 sentadillas. Terminas cada movimiento antes de pasar al siguiente.",
    strategy: "Las dominadas son lo más duro: series cortas y frecuentes (por ejemplo 10 × 10). Guarda energía para las flexiones.",
    scale: { b: "50 de cada uno · remo invertido · flexiones con rodillas.", n: "100 de cada uno con dominadas con banda.", a: "Rx: 100 de cada uno." },
    ref: "Principiante 28–35 min · intermedio 20–28 · avanzado 15–20 · élite <15.",
    moves: ["dominada", "flexiones", "sit-up", "sentadilla"] },
  "wod-jackie": {
    how: "Por tiempo: remo 1.000 m, luego 50 thrusters y luego 30 dominadas.",
    strategy: "No vacíes el tanque en el remo (unos 3:30–4:30 min). Los 50 thrusters en bloques de 10–15.",
    scale: { b: "Remo 500 m · thruster con mancuernas livianas · remo invertido.", n: "Remo 1.000 m · thruster 15/10 kg · dominadas con banda.", a: "Rx: barra 20/15 kg · dominadas." },
    ref: "Principiante 12–15 min · intermedio 9–12 · avanzado 7–9 · élite <7.",
    moves: ["remo-ergometro", "thruster", "dominada"] },
  "wod-nancy": {
    how: "5 rondas por tiempo de: correr 400 m y 15 sentadillas overhead.",
    strategy: "La sentadilla overhead exige movilidad y estabilidad: elige un peso con el que puedas hacer las 15 en 1–2 bloques.",
    scale: { b: "Correr/caminar 200 m · sentadilla overhead con PVC o sentadilla goblet.", n: "400 m · 20/15 kg.", a: "Rx: 43/29 kg." },
    ref: "Principiante 18–22 min · intermedio 14–18 · avanzado 11–14 · élite <11.",
    moves: ["correr", "sentadilla-overhead"] },
  "wod-kelly": {
    how: "5 rondas por tiempo de: correr 400 m, 30 saltos al cajón y 30 wall balls.",
    strategy: "Es largo (más de 30 minutos para la mayoría): ritmo constante. En el cajón puedes bajar con un paso para ahorrar las piernas.",
    scale: { b: "3 rondas · 200 m · step-ups · balón 4/3 kg.", n: "5 rondas · cajón 50/40 cm · balón 6/4 kg.", a: "Rx: cajón 60/50 cm · balón 9/6 kg." },
    ref: "Principiante 38–45 min · intermedio 30–38 · avanzado 25–30 · élite <25.",
    moves: ["correr", "salto-cajon", "wall-ball"] },
  "wod-dt": {
    how: "5 rondas por tiempo de: 12 pesos muertos, 9 cargadas de potencia colgantes y 6 enviones de empuje (push jerk), todo con la misma barra.",
    strategy: "El agarre y los hombros se cansan: intenta no soltar la barra dentro de cada movimiento. Descansos cortos entre ejercicios.",
    scale: { b: "Barra 30/20 kg o mancuernas.", n: "50/35 kg.", a: "Rx: 70/47 kg." },
    ref: "Principiante 12–15 min · intermedio 9–12 · avanzado 6–9 · élite <6.",
    moves: ["peso-muerto", "cargada", "envion"] },
  "wod-murph": {
    how: "Por tiempo: correr 1,6 km, 100 dominadas, 200 flexiones, 300 sentadillas y correr 1,6 km. Rx con chaleco. Puedes repartir las dominadas, flexiones y sentadillas como quieras (lo clásico: 20 rondas de 5-10-15).",
    strategy: "Repártelo en 20 rondas de 5 dominadas, 10 flexiones y 15 sentadillas desde el principio. Hidrátate y no salgas rápido en la primera carrera.",
    scale: { b: "«Medio Murph»: 800 m, 50-100-150, 800 m · sin chaleco · flexiones con rodillas.", n: "Completo sin chaleco · dominadas con banda.", a: "Rx: con chaleco 9/6 kg." },
    ref: "Principiante 60–75 min · intermedio 45–60 · avanzado 35–45 · élite <35 (con chaleco).",
    moves: ["correr", "dominada", "flexiones", "sentadilla"] },
  "wod-chelsea": {
    how: "EMOM de 30 minutos: al inicio de cada minuto haz 5 dominadas, 10 flexiones y 15 sentadillas; descansa lo que quede del minuto. Si no completas la ronda dentro del minuto, se acaba el WOD.",
    strategy: "Las primeras rondas te dejan ~25 s de descanso; con la fatiga se acortan. Ritmo parejo y transiciones rápidas.",
    scale: { b: "20 minutos · dominadas con banda o remo invertido · flexiones con rodillas.", n: "30 minutos con dominadas con banda.", a: "Rx: 30 minutos completos." },
    ref: "Principiante 10–15 rondas · intermedio 16–24 · avanzado 25–30 · élite 30 completas.",
    moves: ["dominada", "flexiones", "sentadilla"] },
  "wod-chief": {
    how: "5 ciclos de AMRAP de 3 minutos (3 cargadas de potencia, 6 flexiones y 9 sentadillas) con 1 minuto de descanso entre ciclos. El resultado es el total de rondas de los 5 ciclos.",
    strategy: "Cada ciclo es un sprint corto: transiciones rápidas. En el minuto de descanso respira y prepárate para arrancar en cuanto suene.",
    scale: { b: "Cargada con mancuernas o barra vacía · flexiones con rodillas.", n: "40/30 kg.", a: "Rx: 61/43 kg." },
    ref: "Principiante 12–18 rondas · intermedio 19–25 · avanzado 26–32 · élite 33+.",
    moves: ["cargada", "flexiones", "sentadilla"] },
  "wod-fgb": {
    how: "3 rondas de 1 minuto en cada estación: wall balls, peso muerto sumo con jalón alto, saltos al cajón, push press y remo (calorías), más 1 minuto de descanso. Suma 1 punto por repetición (y por caloría).",
    strategy: "No vacíes el tanque en la primera ronda. En el remo mantén un ritmo alto pero recuperable antes del descanso.",
    scale: { b: "Balón 4/3 kg · barra 15/10 kg · step-ups.", n: "Balón 6/4 kg · barra 25/20 kg · cajón 40 cm.", a: "Rx: balón 9/6 kg · barra 34/25 kg · cajón 50 cm." },
    ref: "Principiante <200 puntos · intermedio 200–299 · avanzado 300–399 · élite 400+.",
    moves: ["wall-ball", "sdhp", "salto-cajon", "envion", "remo-ergometro"] },
  "wod-tabata-se": {
    how: "Tabata (20 s de trabajo / 10 s de descanso, 8 rondas) de cada movimiento, uno tras otro sin pausa: dominadas, flexiones, abdominales y sentadillas. 16 minutos. Puntaje: total de repeticiones (o la ronda más baja de cada movimiento, según la versión).",
    strategy: "Intenta mantener el mismo número de repeticiones en las 8 rondas de cada movimiento: salir a tope en la primera hunde las siguientes.",
    scale: { b: "Remo invertido · flexiones con rodillas · crunch · sentadilla a un cajón.", n: "Dominadas con banda.", a: "Rx: todos los movimientos completos." },
    ref: "Principiante <250 repeticiones · intermedio 250–350 · avanzado 350–450 · élite 450+.",
    moves: ["dominada", "flexiones", "sit-up", "sentadilla"] },
};
