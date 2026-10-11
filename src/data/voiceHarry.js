/* Paquete de voz "Harry" (ElevenLabs, inglés). Cada clave es un audio en
   public/voice/harry/<clave>.mp3, generado una sola vez con
   scripts/generate-voice.cjs. Los textos llevan etiquetas de emoción de eleven_v3. */

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
  "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = { 20: "twenty", 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty" };
export function numberWord(n){
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10) * 10, u = n % 10;
  return u ? `${TENS[t]}-${ONES[u]}` : TENS[t];
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

export const MAX_ROUND = 32;   // "Round N" / "of N" pregenerados hasta aquí
// Minutos con aviso hablado ("N minutes left!" / "N minutes in."): 1-20 y luego de 5 en 5 hasta 60.
export const MINUTE_MARKS = [...Array.from({ length: 20 }, (_, i) => i + 1), 25, 30, 35, 40, 45, 50, 55, 60];
export const MAX_COUNT = 10;   // cuenta regresiva hablada

const P = {};
for (let n = 1; n <= MAX_COUNT; n++) P[`count-${n}`] = `[firmly] ${cap(numberWord(n))}!`;
for (let n = 1; n <= MAX_ROUND; n++) P[`round-${n}`] = `[excited] Round ${numberWord(n)}!`;
for (let n = 2; n <= MAX_ROUND; n++) P[`of-${n}`] = `of ${numberWord(n)}.`;
for (const n of MINUTE_MARKS) {
  const m = n === 1 ? "One minute" : `${cap(numberWord(n))} minutes`;
  P[`left-${n}`] = `[excited] ${m} left!`;
  P[`in-${n}`] = `${m} in.`;
}

Object.assign(P, {
  "last-round": "[shouting] Last round!",
  // Fases
  "ph-work": "[shouting] Work!",
  "ph-rest": "[relieved] Rest.",
  "ph-get-ready": "[excited] Get ready!",
  "ph-warmup": "Warm up. Easy pace.",
  "ph-cooldown": "[relieved] Cool down. Nice and easy.",
  "ph-rest-rounds": "[relieved] Rest between rounds.",
  "ph-rest-sets": "[relieved] Rest between sets.",
  "ph-minute": "[shouting] New minute! Go!",
  "ph-fight": "[shouting] Fight!",
  "ph-amrap3": "[shouting] Three minute AMRAP! Go!",
  "ph-wallballs": "[shouting] Wall balls!",
  "ph-sdhp": "[shouting] Sumo deadlift high pull!",
  "ph-boxjumps": "[shouting] Box jumps!",
  "ph-pushpress": "[shouting] Push press!",
  "ph-row": "[shouting] Row! Calories!",
  "open-amrap": "[shouting] AMRAP!",
  "open-fortime": "[shouting] For time! Go, go, go!",
  // Avisos
  "warn-60": "[excited] One minute left!",
  "warn-30": "[excited] Thirty seconds left!",
  "warn-10": "[shouting] Ten seconds!",
  "halfway": "[excited] Halfway there!",
  "fin-time": "[shouting] Time!",
});

/* Frases de ánimo. "chileno" (estilo motivador, limpio) y "garabatos" (con groserías en inglés). */
export const CHEERS = {
  chileno: {
    work: ["Let's go!", "Come on!", "You got this!", "Push it!", "Move, move, move!", "Stay strong!"],
    push: ["Don't quit now!", "Keep pushing!", "Almost there!", "Dig deep!", "You got this!"],
    rest: ["Breathe.", "Shake it out.", "Recover. More coming."],
    last: ["Leave it all out there!", "Empty the tank!"],
    open: ["Let's go!", "Come on!"],
    round: ["Nice!", "Keep it going!", "Another one!"],
    finish: ["Great job!", "You're a beast!", "Hell yeah!"],
  },
  garabatos: {
    work: ["Let's fucking go!", "Come on, motherfucker!", "Fuck yeah, let's go!", "Move your ass!"],
    push: ["Don't you fucking quit!", "Push, goddammit!", "No fucking excuses!", "Don't you quit on me!"],
    rest: ["Breathe, we're not fucking done."],
    last: ["Last one, give it everything you fucking got!"],
    open: ["Let's fucking go!"],
    round: ["Fuck yeah!", "Another one, let's go!"],
    finish: ["Hell yeah, you're a fucking beast!", "Fuck yeah! That was brutal!"],
  },
};
const TAG = { work: "[shouting]", push: "[shouting]", rest: "[relieved]", last: "[shouting]", open: "[shouting]", round: "[excited]", finish: "[laughs]" };
for (const [style, kinds] of Object.entries(CHEERS))
  for (const [kind, list] of Object.entries(kinds))
    list.forEach((t, i) => { P[`ch-${style}-${kind}-${i}`] = `${TAG[kind]} ${t}`; });

export const PHRASES = P;
export const VOICE_HARRY = { id: "SOYHLrjzK2X1ezoPC6cr", name: "Harry", model: "eleven_v3", lang: "en", dir: "voice/harry" };
