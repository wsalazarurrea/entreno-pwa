import { Minus, Plus } from "lucide-react";
import { formatRest, REST_OPTIONS } from "../../lib/dates.js";
import { cx } from "../../lib/cx.js";

/** Selector de tiempo de descanso (rueda nativa en el teléfono) con − y + para
 * pasar al tiempo anterior/siguiente. Con `defaultSeconds`, ofrece
 * "Predeterminado" (value null). */
export function RestSelect({ value, onChange, defaultSeconds, className }){
  const opts = REST_OPTIONS.includes(value) || value == null ? REST_OPTIONS : [...REST_OPTIONS, value].sort((a, b) => a - b);
  const cur = value ?? defaultSeconds ?? 0;
  const step = (d) => {
    const next = d > 0 ? opts.find(s => s > cur) : [...opts].reverse().find(s => s < cur);
    if (next != null) onChange(next);
  };
  const btn = "shrink-0 w-10 rounded-xl bg-panel2 text-mut grid place-items-center cursor-pointer active:scale-90 transition-transform";
  return (
    <div className={cx("flex gap-1.5 items-stretch", className)}>
      <button type="button" className={btn} onClick={() => step(-1)} aria-label="menos descanso"><Minus size={16} strokeWidth={2.5} /></button>
      <select
        value={value == null ? "" : String(value)}
        onChange={e => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className="flex-1 min-w-0 px-3 py-2.5 bg-panel border border-line rounded-xl text-ink text-center outline-none focus:border-amber"
      >
        {defaultSeconds != null && <option value="">Predeterminado ({formatRest(defaultSeconds)})</option>}
        {opts.map(s => <option key={s} value={s}>{s ? `${formatRest(s)} min` : "Apagado"}</option>)}
      </select>
      <button type="button" className={btn} onClick={() => step(1)} aria-label="más descanso"><Plus size={16} strokeWidth={2.5} /></button>
    </div>
  );
}
