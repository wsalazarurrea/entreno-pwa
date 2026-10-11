import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowLeft } from "lucide-react";
import { exerciseHistory, exerciseRecords, SET_TYPES, isWorking } from "../lib/workouts.js";
import { formatDay, formatShort } from "../lib/dates.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";

const METRICS = [
  { key: "e1rm", label: "1RM est.", unit: "kg" },
  { key: "tw", label: "Peso máx.", unit: "kg" },
  { key: "vol", label: "Volumen", unit: "kg" },
  { key: "reps", label: "Reps máx.", unit: "" },
];

export function SetList({ sets, unit }){
  let n = 0;
  return (
    <div className="flex flex-col gap-0.5">
      {sets.map((s, i) => {
        const t = SET_TYPES[s.type] || SET_TYPES.normal;
        if (isWorking(s)) n++;
        return (
          <div key={i} className="flex gap-3 text-[13.5px] font-mono">
            <span className={cx("w-5 text-center font-bold", t.cls || "text-faint")}>{t.short || n}</span>
            <span className="text-ink">{s.w ? `${s.w} kg${unit === "kg/mano" ? "/mano" : ""}` : unit === "bw" ? "PC" : "0 kg"} × {s.r ?? "–"}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ExerciseDetail({ name, info, workouts, onBack }){
  const [metric, setMetric] = useState("e1rm");
  const hist = useMemo(() => exerciseHistory(workouts, name), [workouts, name]);
  const rec = useMemo(() => exerciseRecords(workouts, name), [workouts, name]);
  const m = METRICS.find(x => x.key === metric);
  const series = hist.filter(p => p[metric] > 0).map(p => ({ date: formatShort(p.date), v: Math.round(p[metric] * 10) / 10 }));

  const tiles = [
    ["Peso máximo", rec.maxWeight && `${rec.maxWeight.value} kg`, rec.maxWeight?.date],
    ["Mejor 1RM estimado", rec.bestE1rm && `${Math.round(rec.bestE1rm.value)} kg`, rec.bestE1rm?.date],
    ["Mejor serie", rec.bestSet && `${rec.bestSet.w} × ${rec.bestSet.r}`, rec.bestSet?.date],
    ["Más repeticiones", rec.maxReps && `${rec.maxReps.value} reps`, rec.maxReps?.date],
    ["Mejor volumen (sesión)", rec.bestSession && `${rec.bestSession.value.toLocaleString("es")} kg`, rec.bestSession?.date],
    ["Veces realizado", `${hist.length}`, hist.at(-1)?.date],
  ];

  return (
    <div>
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-mut text-sm mb-3 cursor-pointer"><ArrowLeft size={17} /> Ejercicios</button>
      <h2 className="text-xl font-bold leading-snug">{name}</h2>
      {info && <div className="text-[13px] text-mut mb-4">{info.muscle} · {info.equipment}</div>}

      <div className="grid grid-cols-2 gap-2 mb-4">
        {tiles.map(([l, v, d]) => (
          <Card key={l} className="p-3">
            <div className="text-[11px] text-faint">{l}</div>
            <div className="font-mono font-bold text-[16px]">{v || "—"}</div>
            {v && d && <div className="text-[11px] text-faint">{formatShort(d)}</div>}
          </Card>
        ))}
      </div>

      <div className="flex gap-1.5 mb-2 overflow-x-auto">
        {METRICS.map(x => (
          <button key={x.key} type="button" onClick={() => setMetric(x.key)}
            className={cx("px-3 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap cursor-pointer", metric === x.key ? "bg-amber text-white" : "bg-panel2 text-mut")}>
            {x.label}
          </button>
        ))}
      </div>
      <Card className="p-2 pt-4 mb-5" style={{ height: 230 }}>
        {series.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 4, right: 12, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#ECE2D5" vertical={false} />
              <XAxis dataKey="date" stroke="#8C8175" fontSize={11} tickLine={false} axisLine={{ stroke: "#ECE2D5" }} minTickGap={24} />
              <YAxis stroke="#8C8175" fontSize={11} tickLine={false} axisLine={false} width={44} domain={["auto", "auto"]} />
              <Tooltip formatter={(v) => [`${v} ${m.unit}`, m.label]} contentStyle={{ background: "#FFFFFF", border: "1px solid #ECE2D5", borderRadius: 8, color: "#241C13", fontSize: 12 }} labelStyle={{ color: "#8C8175" }} />
              <Line type="monotone" dataKey="v" stroke="#EF6C2E" strokeWidth={2.5} dot={{ r: 2, fill: "#EF6C2E" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : <div className="h-full grid place-items-center text-sm text-faint">Aún no hay suficientes datos para graficar.</div>}
      </Card>

      <h3 className="font-bold mb-2">Historial</h3>
      <div className="flex flex-col gap-2">
        {[...hist].reverse().map((p, i) => (
          <Card key={p.workoutId + i} className="p-3">
            <div className="flex justify-between gap-2 mb-1.5">
              <span className="text-[13px] font-semibold truncate">{p.title}</span>
              <span className="text-[12px] text-faint whitespace-nowrap">{formatDay(p.date)}</span>
            </div>
            {p.sets.length ? <SetList sets={p.sets} unit={p.unit} />
              : <div className="text-[13px] font-mono text-mut">máx {p.tw || "PC"} kg · e1RM {Math.round(p.e1rm)} · vol {Math.round(p.vol).toLocaleString("es")} kg <span className="text-faint">(sólo totales)</span></div>}
          </Card>
        ))}
      </div>
    </div>
  );
}
