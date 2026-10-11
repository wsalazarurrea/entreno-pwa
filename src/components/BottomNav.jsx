import { Dumbbell, Timer, History, ClipboardList, Settings } from "lucide-react";
import { cx } from "../lib/cx.js";

const TABS = [
  { key:"train", label:"Entrenar", icon:Dumbbell },
  { key:"intervals", label:"Intervalos", icon:Timer },
  { key:"history", label:"Historial", icon:History },
  { key:"routines", label:"Rutinas", icon:ClipboardList },
  { key:"settings", label:"Ajustes", icon:Settings },
];

export function BottomNav({ tab, onChange }){
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-10 border-t border-line bg-panel/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {TABS.map(t => {
          const active = tab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={()=>onChange(t.key)}
              className={cx(
                "flex-1 flex flex-col items-center gap-1 py-2.5 cursor-pointer transition-colors",
                active ? "text-amber" : "text-mut"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[11px] font-medium">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
