import { DAY_ORDER, ROUTINES } from "../data/routines.js";
import { Card } from "./ui/Card.jsx";
import { Tag } from "./ui/Tag.jsx";

export function Routines(){
  return (
    <div className="p-4 pb-24">
      <h2 className="text-xl font-bold mb-1">Rutinas del bloque</h2>
      <div className="text-mut text-[13px] mb-4">Especialización pecho · 4 días · pesos de arranque desde tus datos.</div>
      {DAY_ORDER.map(k => {
        const r = ROUTINES[k];
        return (
          <Card key={k} className="p-4 mb-3">
            <div className="flex gap-2 items-center mb-3">
              <Tag accent={r.accent}>{r.tag}</Tag>
              <span className="font-bold text-[16px]">{r.title}</span>
            </div>
            {r.ex.map((e,i) => (
              <div key={i} className={i ? "flex justify-between gap-2 py-1.5 border-t border-line" : "flex justify-between gap-2 py-1.5"}>
                <span className="text-sm">{e.name}</span>
                <span className="font-mono text-[13px] text-mut whitespace-nowrap ml-2.5">
                  {e.sets}×{e.lo}-{e.hi} · {e.unit==="bw" ? "PC" : `${e.start}${e.unit.includes("/") ? e.unit.slice(2) : "kg"}`}
                </span>
              </div>
            ))}
          </Card>
        );
      })}
      <div className="text-faint text-xs leading-relaxed mt-2 italic">
        Progresión: doble progresión en pecho (cierras el tope de reps en todas las series → subes peso). Resto en mantenimiento a 2-3 RIR. Semana 7: descarga.
      </div>
    </div>
  );
}
