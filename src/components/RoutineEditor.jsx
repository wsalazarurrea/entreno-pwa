import { useState } from "react";
import { ArrowLeft, Check, Trash2, Plus, GripVertical, ChevronRight } from "lucide-react";
import { ACCENTS, UNITS, blankExercise, cloneRoutines, newId } from "../data/routines.js";
import { findExercise, unitForEquipment } from "../data/exercises.js";
import { parseNum, incFor } from "../lib/training.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { StepInput } from "./ui/StepInput.jsx";
import { RestSelect } from "./ui/RestSelect.jsx";
import { ConfirmDialog } from "./ui/Sheet.jsx";
import { SortableList, SortableItem } from "./ui/Sortable.jsx";
import { ExercisePicker } from "./ExercisePicker.jsx";
import { arrayMove } from "../lib/array.js";
import { ACCENT } from "./ui/accent.js";

const inputCls = "w-full px-3 py-2.5 bg-panel border border-line rounded-xl text-ink outline-none focus:border-amber";
const fieldLabel = "text-[11px] font-medium text-mut mb-1 block";
const numIn = "h-10";
const numBtn = "h-10 w-8";

export function RoutineEditor({ routine, catalog, recent, customExercises, restDefault, onCreateCustom, onSave, onCancel, onDelete }){
  // `_k`: id transitorio por ejercicio para el arrastre y las keys de React; se descarta al guardar.
  const [draft, setDraft] = useState(() => {
    const r = cloneRoutines(routine);
    r.ex = r.ex.filter(e => e.name).map(e => ({ ...e, _k: newId("e") }));
    return r;
  });
  const [picker, setPicker] = useState(null); // { mode: "add" } | { mode: "change", i }
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isNew = !onDelete;

  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setEx = (i, k, v) => setDraft(d => ({ ...d, ex: d.ex.map((e, j) => j === i ? { ...e, [k]: v } : e) }));
  const removeEx = (i) => setDraft(d => ({ ...d, ex: d.ex.filter((_, j) => j !== i) }));
  const reorderEx = (from, to) => setDraft(d => ({ ...d, ex: arrayMove(d.ex, from, to) }));
  const unitOf = (name) => { const f = findExercise(name, customExercises); return f ? unitForEquipment(f.equipment) : "kg"; };
  const addNames = (names) => setDraft(d => ({ ...d, ex: [...d.ex, ...names.map(n => ({ ...blankExercise(), name: n, unit: unitOf(n), _k: newId("e") }))] }));
  const changeName = (i, name) => setDraft(d => ({ ...d, ex: d.ex.map((e, j) => j === i ? { ...e, name, unit: unitOf(name) } : e) }));

  const save = () => {
    const num = (v, def, min = 0) => { const n = parseNum(v); return n == null ? def : Math.max(min, n); };
    const cleaned = {
      ...draft,
      title: draft.title.trim() || "Rutina sin nombre",
      tag: (draft.tag.trim() || "RUT").toUpperCase().slice(0, 8),
      ex: draft.ex
        .filter(e => e.name.trim())
        .map(({ _k, ...e }) => {
          const lo = Math.round(num(e.lo, 8)), hi = Math.round(num(e.hi, 12));
          const out = { ...e, name: e.name.trim(), note: (e.note || "").trim(), sets: Math.round(num(e.sets, 3, 1)), lo: Math.min(lo, hi), hi: Math.max(lo, hi), start: num(e.start, 0) };
          if (out.rest == null) delete out.rest;
          return out;
        }),
    };
    onSave(cleaned);
  };

  return (
    <div className="pb-32">
      <div className="sticky-top z-10 bg-bg/95 backdrop-blur border-b border-line px-4 py-3 flex items-center justify-between">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-mut cursor-pointer text-sm">
          <ArrowLeft size={18} /> Cancelar
        </button>
        <span className="font-bold">{isNew ? "Nueva rutina" : "Editar rutina"}</span>
        <button onClick={save} className="flex items-center gap-1.5 bg-amber text-white rounded-lg px-3 py-2 font-bold text-sm cursor-pointer">
          <Check size={16} /> Guardar
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <Card className="p-4 flex flex-col gap-3.5">
          <div>
            <label className={fieldLabel}>Nombre de la rutina</label>
            <input className={cx(inputCls, "font-semibold")} value={draft.title}
              onChange={e => setField("title", e.target.value)} placeholder="Ej. Pecho pesado" />
          </div>
          <div className="flex gap-3">
            <div className="w-28">
              <label className={fieldLabel}>Etiqueta</label>
              <input className={cx(inputCls, "font-mono uppercase")} value={draft.tag}
                onChange={e => setField("tag", e.target.value)} maxLength={8} placeholder="SUP A" />
            </div>
            <div className="flex-1">
              <label className={fieldLabel}>Color</label>
              <div className="flex gap-2.5 items-center h-[42px]">
                {ACCENTS.map(key => {
                  const a = ACCENT[key];
                  const sel = draft.accent === key;
                  return (
                    <button key={key} type="button" onClick={() => setField("accent", key)}
                      aria-label={`color ${key}`}
                      className={cx("w-8 h-8 rounded-full cursor-pointer transition-transform", a.bg,
                        sel ? "ring-2 ring-offset-2 ring-offset-panel scale-110" : "opacity-70")}
                      style={sel ? { boxShadow: "0 0 0 2px var(--color-panel)" } : undefined} />
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-[15px]">Ejercicios <span className="text-mut font-normal">({draft.ex.length})</span></span>
          <span className="text-faint text-[11px]">arrastra ⠿ para reordenar</span>
        </div>

        <SortableList ids={draft.ex.map(e => e._k)} onReorder={reorderEx}>
          <div className="flex flex-col gap-3">
            {draft.ex.map((e, i) => (
              <SortableItem key={e._k} id={e._k}>
                {({ setNodeRef, style, handleProps, isDragging }) => (
                  <div ref={setNodeRef} style={style}>
                    <Card className={cx("p-3.5 flex flex-col gap-3", isDragging && "shadow-lg ring-2 ring-amber/40")}>
                      <div className="flex items-center gap-2">
                        <button {...handleProps} aria-label="arrastrar"
                          className="py-2 text-faint cursor-grab active:cursor-grabbing touch-none shrink-0">
                          <GripVertical size={18} />
                        </button>
                        <button type="button" onClick={() => setPicker({ mode: "change", i })}
                          className="flex-1 min-w-0 flex items-center justify-between gap-2 px-3 py-2.5 bg-panel2 rounded-xl text-left cursor-pointer">
                          <span className="font-semibold text-[15px] truncate">{e.name}</span>
                          <ChevronRight size={16} className="text-faint shrink-0" />
                        </button>
                        <button onClick={() => removeEx(i)} aria-label="quitar"
                          className="w-10 h-10 rounded-lg border border-coral/40 text-coral cursor-pointer flex items-center justify-center shrink-0"><Trash2 size={15} /></button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 pl-7">
                        <div>
                          <label className={fieldLabel}>Series</label>
                          <StepInput value={String(e.sets ?? "")} min={1} onChange={v => setEx(i, "sets", v)} inputClassName={numIn} btnClassName={numBtn} />
                        </div>
                        <div>
                          <label className={fieldLabel}>{e.unit === "bw" ? "Lastre (kg)" : "Peso inicial (kg)"}</label>
                          <StepInput decimal value={String(e.start ?? "")} step={incFor(e, customExercises) || 2.5} onChange={v => setEx(i, "start", v)} inputClassName={numIn} btnClassName={numBtn} />
                        </div>
                        <div>
                          <label className={fieldLabel}>Reps mín.</label>
                          <StepInput value={String(e.lo ?? "")} onChange={v => setEx(i, "lo", v)} inputClassName={numIn} btnClassName={numBtn} />
                        </div>
                        <div>
                          <label className={fieldLabel}>Reps máx.</label>
                          <StepInput value={String(e.hi ?? "")} onChange={v => setEx(i, "hi", v)} inputClassName={numIn} btnClassName={numBtn} />
                        </div>
                        <div className="col-span-2">
                          <label className={fieldLabel}>Unidad</label>
                          <select className={cx(inputCls, "appearance-none")} value={e.unit}
                            onChange={ev => setEx(i, "unit", ev.target.value)}>
                            {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className={fieldLabel}>Descanso entre series</label>
                          <RestSelect value={e.rest ?? null} defaultSeconds={restDefault} onChange={v => setEx(i, "rest", v)} className="w-full" />
                        </div>
                        <div className="col-span-2">
                          <label className={fieldLabel}>Nota (opcional)</label>
                          <input className={inputCls} value={e.note || ""}
                            onChange={ev => setEx(i, "note", ev.target.value)} placeholder="Ej. Eccéntrico 3s, pausa abajo" />
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </SortableItem>
            ))}
          </div>
        </SortableList>

        <button onClick={() => setPicker({ mode: "add" })}
          className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-line text-amber rounded-xl cursor-pointer font-medium">
          <Plus size={18} /> Agregar ejercicios
        </button>

        {!isNew && (
          <button onClick={() => setConfirmDelete(true)}
            className="w-full py-3 flex items-center justify-center gap-2 border border-coral/40 text-coral rounded-xl cursor-pointer text-sm mt-2">
            <Trash2 size={15} /> Eliminar esta rutina
          </button>
        )}
      </div>

      <ConfirmDialog open={confirmDelete} title="¿Eliminar rutina?" message={`«${draft.title || "Rutina"}» se eliminará. Tu historial de entrenamientos no se borra.`}
        confirmLabel="Eliminar" danger onCancel={() => setConfirmDelete(false)} onConfirm={() => onDelete(draft.id)} />

      {picker && (
        <ExercisePicker
          title={picker.mode === "add" ? "Agregar ejercicios" : "Cambiar ejercicio"}
          multi={picker.mode === "add"} catalog={catalog} recent={recent} onCreateCustom={onCreateCustom}
          onCancel={() => setPicker(null)}
          onPick={(names) => { if (picker.mode === "add") addNames(names); else changeName(picker.i, names[0]); setPicker(null); }} />
      )}
    </div>
  );
}
