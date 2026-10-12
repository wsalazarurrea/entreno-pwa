import { useState } from "react";
import { Plus, Trash2, Settings2, Check } from "lucide-react";
import { newId } from "../data/routines.js";
import { cx } from "../lib/cx.js";
import { Sheet, ConfirmDialog } from "./ui/Sheet.jsx";

/** Perfiles: agrupan rutinas con un mismo fin. Chips para cambiar de perfil y
 * una hoja para crear, renombrar y borrar. `onChange(patch)` se mezcla en el estado. */
export function ProfileBar({ state, onChange }){
  const [manage, setManage] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const { profiles, activeProfileId: active } = state;
  const count = (id) => state.routines.filter(r => r.profileId === id).length;
  const label = (p) => p.name.trim() || "Sin nombre";

  const rename = (id, name) => onChange({ profiles: profiles.map(p => p.id === id ? { ...p, name } : p) });
  const add = () => { const p = { id: newId("pf"), name: "Nuevo perfil" }; onChange({ profiles: [...profiles, p], activeProfileId: p.id }); };
  const remove = (id) => {
    const rest = profiles.filter(p => p.id !== id);
    onChange({ profiles: rest, routines: state.routines.filter(r => r.profileId !== id), activeProfileId: active === id ? rest[0].id : active });
    setToDelete(null);
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 mb-4">
        {profiles.map(p => (
          <button key={p.id} type="button" onClick={() => onChange({ activeProfileId: p.id })}
            className={cx("shrink-0 px-3.5 py-2 rounded-full border text-[14px] font-semibold whitespace-nowrap cursor-pointer",
              p.id === active ? "bg-amber border-amber text-white" : "bg-panel border-line text-mut")}>
            {label(p)}
          </button>
        ))}
        <button type="button" onClick={() => setManage(true)} aria-label="administrar perfiles"
          className="shrink-0 px-3 py-2 rounded-full border border-line bg-panel text-mut text-[14px] flex items-center gap-1.5 cursor-pointer">
          <Settings2 size={16} /> Perfiles
        </button>
      </div>

      <Sheet open={manage} onClose={() => setManage(false)} title="Perfiles">
        <div className="px-4 pb-4 flex flex-col gap-2">
          <div className="text-[13px] text-mut mb-1">Cada perfil agrupa rutinas con un mismo fin. Entrenar y Rutinas muestran las del perfil activo; el historial es uno solo.</div>
          {profiles.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <button type="button" onClick={() => onChange({ activeProfileId: p.id })} aria-label={`activar ${label(p)}`}
                className={cx("w-9 h-9 rounded-full grid place-items-center border shrink-0 cursor-pointer",
                  p.id === active ? "bg-amber border-amber text-white" : "border-line text-transparent")}>
                <Check size={16} />
              </button>
              <input value={p.name} onChange={e => rename(p.id, e.target.value)} aria-label="nombre del perfil"
                className="flex-1 min-w-0 px-3 py-2 bg-panel2 border border-line rounded-xl text-ink outline-none focus:border-amber" />
              <span className="text-[12px] text-faint shrink-0">{count(p.id)} rut.</span>
              {profiles.length > 1 && (
                <button type="button" onClick={() => setToDelete(p)} aria-label={`borrar ${label(p)}`}
                  className="w-9 h-9 grid place-items-center text-coral shrink-0 cursor-pointer"><Trash2 size={17} /></button>
              )}
            </div>
          ))}
          <button type="button" onClick={add}
            className="mt-2 py-3 rounded-xl border border-dashed border-amber/60 text-amber font-semibold flex items-center justify-center gap-2 cursor-pointer">
            <Plus size={18} /> Nuevo perfil
          </button>
        </div>
      </Sheet>

      <ConfirmDialog open={!!toDelete} danger title={`¿Borrar "${toDelete ? label(toDelete) : ""}"?`}
        message={`${toDelete && count(toDelete.id) ? (count(toDelete.id) === 1 ? "Se borra su rutina." : `Se borran sus ${count(toDelete.id)} rutinas.`) : "No tiene rutinas."} Tu historial de entrenamientos no se toca.`}
        confirmLabel="Borrar perfil" onConfirm={() => remove(toDelete.id)} onCancel={() => setToDelete(null)} />
    </>
  );
}
