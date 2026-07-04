import { cx } from "../../lib/cx.js";
import { ACCENT } from "./accent.js";

export function StatTile({ icon:Icon, label, value, accent="amber" }){
  const a = ACCENT[accent] || ACCENT.amber;
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-line bg-panel px-3 py-2.5 flex items-center gap-3">
      <div className={cx("shrink-0 rounded-lg p-2", a.bgSoft)}>
        <Icon size={18} className={a.text} strokeWidth={2.25} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-mut truncate">{label}</div>
        <div className="text-[15px] font-bold font-mono tabular-nums truncate">{value}</div>
      </div>
    </div>
  );
}
