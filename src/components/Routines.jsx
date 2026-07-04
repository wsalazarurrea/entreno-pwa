import { Plus, Pencil, Copy, ChevronUp, ChevronDown } from "lucide-react";
import { newId, cloneRoutines } from "../data/routines.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { Tag } from "./ui/Tag.jsx";

export function Routines({ routines, onNew, onEdit, onChange }){
  const duplicate = (r) => onChange([...routines, { ...cloneRoutines(r), id: newId(), title: `${r.title} (copia)` }]);
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= routines.length) return;
    const next = [...routines]; [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-bold">Mis rutinas</h2>
        <button onClick={onNew}
          className="flex items-center gap-1.5 bg-amber text-white rounded-lg px-3 py-2 font-bold text-sm cursor-pointer">
          <Plus size={16} /> Nueva
        </button>
      </div>
      <div className="text-mut text-[13px] mb-4">Crea, edita, duplica y reordena tus rutinas y ejercicios con total libertad.</div>

      {routines.length === 0 && (
        <Card className="p-6 text-center">
          <div className="text-mut text-sm mb-3">Aún no tienes rutinas.</div>
          <button onClick={onNew}
            className="inline-flex items-center gap-1.5 bg-amber text-white rounded-lg px-4 py-2.5 font-bold text-sm cursor-pointer">
            <Plus size={16} /> Crear mi primera rutina
          </button>
        </Card>
      )}

      {routines.map((r, i) => (
        <Card key={r.id} className="p-4 mb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Tag accent={r.accent}>{r.tag}</Tag>
              <span className="font-bold text-[16px] truncate">{r.title}</span>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="subir"
                className="w-8 h-8 rounded-lg bg-panel2 text-mut cursor-pointer disabled:opacity-30 flex items-center justify-center"><ChevronUp size={16} /></button>
              <button onClick={() => move(i, 1)} disabled={i === routines.length - 1} aria-label="bajar"
                className="w-8 h-8 rounded-lg bg-panel2 text-mut cursor-pointer disabled:opacity-30 flex items-center justify-center"><ChevronDown size={16} /></button>
            </div>
          </div>
          <div className="text-faint text-[12.5px] mb-3">
            {r.ex.length} ejercicios · {r.ex.reduce((a, e) => a + (e.sets || 0), 0)} series
          </div>
          <div className="flex flex-col gap-1 mb-3">
            {r.ex.map((e, j) => (
              <div key={j} className={cx("flex justify-between gap-2 py-1", j && "border-t border-line")}>
                <span className="text-sm text-ink truncate">{e.name}</span>
                <span className="font-mono text-[13px] text-mut whitespace-nowrap ml-2.5">
                  {e.sets}×{e.lo}-{e.hi} · {e.unit === "bw" ? "PC" : `${e.start}${e.unit.includes("/") ? e.unit.slice(2) : "kg"}`}
                </span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(r)}
              className="flex-1 flex items-center justify-center gap-1.5 border border-line rounded-lg py-2 text-sm font-medium text-ink cursor-pointer">
              <Pencil size={14} /> Editar
            </button>
            <button onClick={() => duplicate(r)} aria-label="duplicar"
              className="w-11 flex items-center justify-center border border-line rounded-lg py-2 text-mut cursor-pointer">
              <Copy size={15} />
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
