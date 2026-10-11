import { useMemo, useState } from "react";
import { ArrowLeft, Search, Check, Plus, X } from "lucide-react";
import { MUSCLES, EQUIPMENT } from "../data/exercises.js";
import { cx } from "../lib/cx.js";

const inputCls = "w-full px-3 py-2.5 bg-panel border border-line rounded-xl text-ink outline-none focus:border-amber";

function CreateForm({ initialName, onCreate, onCancel }){
  const [name, setName] = useState(initialName);
  const [muscle, setMuscle] = useState("Pecho");
  const [equipment, setEquipment] = useState("Máquina");
  return (
    <div className="p-4 flex flex-col gap-3 bg-panel border-b border-line">
      <div className="font-semibold">Nuevo ejercicio</div>
      <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Nombre, ej. Remo Gironda (Cable)" autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <select className={inputCls} value={muscle} onChange={e => setMuscle(e.target.value)}>
          {MUSCLES.map(m => <option key={m}>{m}</option>)}
        </select>
        <select className={inputCls} value={equipment} onChange={e => setEquipment(e.target.value)}>
          {EQUIPMENT.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl bg-panel2 font-semibold cursor-pointer">Cancelar</button>
        <button type="button" disabled={!name.trim()} onClick={() => onCreate({ name: name.replace(/\s+/g, " ").trim(), muscle, equipment })}
          className="flex-1 py-2.5 rounded-xl bg-amber text-white font-bold cursor-pointer disabled:opacity-50">Crear</button>
      </div>
    </div>
  );
}

/** Selector de ejercicios a pantalla completa. `multi` permite elegir varios. */
export function ExercisePicker({ title = "Elegir ejercicio", catalog, recent = [], multi = false, onPick, onCancel, onCreateCustom }){
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [selected, setSelected] = useState([]);
  const [creating, setCreating] = useState(false);

  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const filtered = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    return catalog.filter(e =>
      (!muscle || e.muscle === muscle) && (!equipment || e.equipment === equipment) &&
      words.every(w => norm(e.name).includes(w)));
  }, [catalog, q, muscle, equipment]);

  const byName = useMemo(() => new Map(catalog.map(e => [e.name, e])), [catalog]);
  const recentList = !q && !muscle && !equipment ? recent.map(n => byName.get(n)).filter(Boolean).slice(0, 8) : [];

  const pick = (name) => {
    if (!multi) return onPick([name]);
    setSelected(s => s.includes(name) ? s.filter(x => x !== name) : [...s, name]);
  };
  const create = (ex) => {
    onCreateCustom(ex);
    setCreating(false); setQ("");
    if (multi) setSelected(s => [...s, ex.name]); else onPick([ex.name]);
  };

  const renderRow = (e, key) => {
    const sel = selected.includes(e.name);
    return (
      <button key={key} type="button" onClick={() => pick(e.name)}
        className={cx("w-full flex items-center gap-3 px-4 py-3 text-left border-b border-line cursor-pointer", sel ? "bg-amber/10" : "active:bg-panel2")}>
        <div className="w-9 h-9 rounded-full bg-panel2 grid place-items-center text-[13px] font-bold text-mut shrink-0">{e.name[0]}</div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] text-ink truncate">{e.name}</div>
          <div className="text-[12px] text-faint truncate">{e.muscle} · {e.equipment}{e.custom ? " · personalizado" : ""}</div>
        </div>
        {sel && <Check size={18} className="text-amber shrink-0" />}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-40 bg-bg flex flex-col" style={{ paddingTop: "var(--sat)" }}>
      <div className="px-4 py-3 flex items-center justify-between border-b border-line bg-bg">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 text-mut cursor-pointer"><ArrowLeft size={18} /> Volver</button>
        <span className="font-bold">{title}</span>
        <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-1 text-amber font-semibold text-sm cursor-pointer"><Plus size={16} /> Crear</button>
      </div>

      {creating && <CreateForm initialName={q} onCreate={create} onCancel={() => setCreating(false)} />}

      <div className="px-4 pt-3 pb-2 flex flex-col gap-2 border-b border-line">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Buscar entre ${catalog.length} ejercicios`}
            className={cx(inputCls, "pl-9 pr-9")} />
          {q && <button type="button" onClick={() => setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint cursor-pointer" aria-label="borrar"><X size={16} /></button>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={muscle} onChange={e => setMuscle(e.target.value)} className={cx(inputCls, "py-2", muscle && "border-amber text-amber")}>
            <option value="">Músculo: todos</option>
            {MUSCLES.map(m => <option key={m}>{m}</option>)}
          </select>
          <select value={equipment} onChange={e => setEquipment(e.target.value)} className={cx(inputCls, "py-2", equipment && "border-amber text-amber")}>
            <option value="">Equipo: todo</option>
            {EQUIPMENT.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {recentList.length > 0 && (
          <>
            <div className="px-4 pt-3 pb-1 text-[12px] font-semibold text-mut uppercase tracking-wide">Recientes</div>
            {recentList.map(e => renderRow(e, "r-" + e.name))}
            <div className="px-4 pt-4 pb-1 text-[12px] font-semibold text-mut uppercase tracking-wide">Todos</div>
          </>
        )}
        {filtered.map(e => renderRow(e, e.name))}
        {filtered.length === 0 && (
          <div className="p-6 text-center text-sm text-mut">
            Sin resultados.
            <button type="button" onClick={() => setCreating(true)} className="block mx-auto mt-3 text-amber font-semibold cursor-pointer">+ Crear «{q}»</button>
          </div>
        )}
        <div className="h-24" />
      </div>

      {multi && (
        <div className="p-4 pb-safe border-t border-line bg-bg">
          <button type="button" disabled={!selected.length} onClick={() => onPick(selected)}
            className="w-full py-3.5 rounded-xl bg-amber text-white font-bold cursor-pointer disabled:opacity-50">
            {selected.length ? `Agregar ${selected.length} ejercicio${selected.length > 1 ? "s" : ""}` : "Selecciona ejercicios"}
          </button>
        </div>
      )}
    </div>
  );
}
