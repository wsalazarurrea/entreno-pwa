import { Trophy, Sparkles } from "lucide-react";
import { PR_LABEL } from "../lib/workouts.js";
import { formatDay, formatDuration } from "../lib/dates.js";
import { Card } from "./ui/Card.jsx";
import { cx } from "../lib/cx.js";

export function Summary({ data, onClose }){
  const fmtPR = (p) => p.kind === "reps" ? `${p.value} reps` : `${Math.round(p.value * 10) / 10} kg`;
  return (
    <div className="p-4 pb-32">
      <div className="text-center pt-4 pb-5">
        <div className="text-[40px] leading-none mb-2">💪</div>
        <h2 className="font-display text-[34px] leading-none text-hot">¡Entrenamiento guardado!</h2>
        <div className="text-mut text-[14px] mt-1">{data.title} · {formatDay(data.date)}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3.5">
        {[["Duración", formatDuration(data.durationSec) || "—"], ["Volumen", `${Math.round(data.volume).toLocaleString("es")} kg`], ["Series", data.sets]].map(([l, v]) => (
          <Card key={l} className="p-3 text-center">
            <div className="text-[11px] text-faint">{l}</div>
            <div className="font-mono font-bold text-[15px] mt-0.5">{v}</div>
          </Card>
        ))}
      </div>

      {data.health && (
        <Card className={cx("p-3 mb-3.5 text-[13.5px]", data.health.error ? "bg-coral/10! border-coral/40! text-ink" : "text-ink")}>
          {data.health.pending ? "Abriendo Atajos para guardar en Apple Salud…" : data.health.ok ? "❤️ Guardado en Apple Salud (aparece en Fitness)." : `No se guardó en Salud: ${data.health.error}`}
        </Card>
      )}

      {data.prs.length > 0 && (
        <Card className="bg-teal/10! border-teal/40! p-3.5 mb-3.5">
          <div className="text-teal font-bold mb-1.5 flex items-center gap-1.5"><Trophy size={16} /> {data.prs.length} récord{data.prs.length > 1 ? "s" : ""} personal{data.prs.length > 1 ? "es" : ""}</div>
          {data.prs.map((p, i) => (
            <div key={i} className="text-sm text-ink py-0.5">{p.name}: <span className="text-mut">{PR_LABEL[p.kind]}</span> <span className="font-mono font-semibold">{fmtPR(p)}</span></div>
          ))}
        </Card>
      )}

      {data.nextHints.length > 0 && (
        <Card className="p-3.5 mb-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={16} className="text-amber" />
            <span className="font-bold text-sm">Para la próxima vez</span>
          </div>
          {data.nextHints.map((h, i) => <div key={i} className="text-[13.5px] text-mut py-0.5">· {h}</div>)}
        </Card>
      )}

      <button onClick={onClose} className="w-full py-3.5 bg-amber text-white rounded-xl text-[15px] font-bold cursor-pointer">Listo</button>
    </div>
  );
}
