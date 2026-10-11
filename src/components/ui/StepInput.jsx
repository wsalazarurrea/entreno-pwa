import { Minus, Plus } from "lucide-react";
import { parseNum } from "../../lib/training.js";
import { cx } from "../../lib/cx.js";
import { NumInput } from "./NumInput.jsx";

/** Campo numérico con − y + a los lados: se puede escribir el valor o ajustarlo
 * con los botones. Si está vacío, los botones parten del valor sugerido (placeholder). */
export function StepInput({ value, onChange, step = 1, min = 0, decimal = false, placeholder, className, inputClassName, btnClassName, ...rest }){
  const bump = (d) => {
    const base = parseNum(value) ?? parseNum(placeholder) ?? 0;
    const n = Math.max(min, Math.round((base + d) * 100) / 100);
    onChange(String(n));
  };
  const btn = cx("shrink-0 w-7 h-9 rounded-md bg-panel2 text-mut grid place-items-center cursor-pointer active:scale-90 active:text-ink transition-transform", btnClassName);
  return (
    <div className={cx("flex items-center gap-1 min-w-0", className)}>
      <button type="button" tabIndex={-1} className={btn} onClick={() => bump(-step)} aria-label="menos"><Minus size={14} strokeWidth={2.5} /></button>
      <NumInput value={value} onChange={onChange} decimal={decimal} placeholder={placeholder} className={cx("h-9", inputClassName)} {...rest} />
      <button type="button" tabIndex={-1} className={btn} onClick={() => bump(step)} aria-label="más"><Plus size={14} strokeWidth={2.5} /></button>
    </div>
  );
}
