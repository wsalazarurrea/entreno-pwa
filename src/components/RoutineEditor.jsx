import { useState } from "react";
import { ArrowLeft, Check, Trash2, Plus, GripVertical } from "lucide-react";
import { ACCENTS, UNITS, blankExercise, cloneRoutines, newId } from "../data/routines.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { Stepper } from "./ui/Stepper.jsx";
import { SortableList, SortableItem } from "./ui/Sortable.jsx";
import { arrayMove } from "../lib/array.js";
import { ACCENT } from "./ui/accent.js";

const inputCls = "w-full px-3 py-2.5 bg-panel border border-line rounded-xl text-sm text-ink outline-none focus:border-amber";
const fieldLabel = "text-[11px] font-medium text-mut mb-1 block";

export function RoutineEditor({ routine, knownExercises, onSave, onCancel, onDelete }){
  // `_k`: id transitorio por ejercicio para el arrastre y las keys de React; se descarta al guardar.
  const [draft, setDraft] = useState(() => {
    const r = cloneRoutines(routine);
    r.ex = r.ex.map(e => ({ ...e, _k: newId("e") }));
    return r;
  });
  const isNew = !onDelete;

  const setField = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const setEx = (i, k, v) => setDraft(d => ({ ...d, ex: d.ex.map((e, j) => j === i ? { ...e, [k]: v } : e) }));
  const addEx = () => setDraft(d => ({ ...d, ex: [...d.ex, { ...blankExercise(), _k: newId("e") }] }));
  const removeEx = (i) => setDraft(d => ({ ...d, ex: d.ex.filter((_, j) => j !== i) }));
  const reorderEx = (from, to) => setDraft(d => ({ ...d, ex: arrayMove(d.ex, from, to) }));

  const save = () => {
    const cleaned = {
      ...draft,
      title: draft.title.trim() || "Rutina sin nombre",
      tag: (draft.tag.trim() || "RUT").toUpperCase().slice(0, 8),
      ex: draft.ex
        .filter(e => e.name.trim())
        .map(({ _k, ...e }) => ({ ...e, name: e.name.trim(), note: (e.note || "").trim() })),
    };
    onSave(cleaned);
  };

  return (
    <div className="pb-32">
      <datalist id="known-exercises">
        {knownExercises.map(n => <option key={n} value={n} />)}
      </datalist>

      <div className="sticky top-0 z-10 bg-bg/95 backdrop-blur border-b border-line px-4 py-3.5 flex items-center justify-between">
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
            <input className={cx(inputCls, "text-base font-semibold")} value={draft.title}
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
                      <div className="flex items-start gap-2">
                        <button {...handleProps} aria-label="arrastrar"
                          className="pt-2 text-faint cursor-grab active:cursor-grabbing touch-none shrink-0">
                          <GripVertical size={18} />
                        </button>
                        <div className="flex-1 min-w-0">
                          <input list="known-exercises" className={inputCls} value={e.name}
                            onChange={ev => setEx(i, "name", ev.target.value)} placeholder="Nombre del ejercicio" />
                        </div>
                        <button onClick={() => removeEx(i)} aria-label="quitar"
                          className="w-9 h-9 rounded-lg border border-coral/40 text-coral cursor-pointer flex items-center justify-center shrink-0"><Trash2 size={15} /></button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pl-7">
                        <div>
                          <label className={fieldLabel}>Series</label>
                          <Stepper value={e.sets} step={1} min={1} onChange={v => setEx(i, "sets", v)} />
                        </div>
                        <div>
                          <label className={fieldLabel}>Unidad</label>
                          <select className={cx(inputCls, "appearance-none")} value={e.unit}
                            onChange={ev => setEx(i, "unit", ev.target.value)}>
                            {UNITS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={fieldLabel}>Reps mín.</label>
                          <Stepper value={e.lo} step={1} min={0} onChange={v => setEx(i, "lo", v)} />
                        </div>
                        <div>
                          <label className={fieldLabel}>Reps máx.</label>
                          <Stepper value={e.hi} step={1} min={0} onChange={v => setEx(i, "hi", v)} />
                        </div>
                        {e.unit !== "bw" && (
                          <div className="col-span-2">
                            <label className={fieldLabel}>Peso de arranque ({e.unit})</label>
                            <input type="number" inputMode="decimal" min="0" step="0.5" className={inputCls}
                              value={e.start}
                              onChange={ev => setEx(i, "start", ev.target.value === "" ? 0 : Math.max(0, parseFloat(ev.target.value) || 0))} />
                          </div>
                        )}
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

        <button onClick={addEx}
          className="w-full py-3 flex items-center justify-center gap-2 border border-dashed border-line text-amber rounded-xl cursor-pointer font-medium">
          <Plus size={18} /> Agregar ejercicio
        </button>

        {!isNew && (
          <button onClick={() => onDelete(draft.id)}
            className="w-full py-3 flex items-center justify-center gap-2 border border-coral/40 text-coral rounded-xl cursor-pointer text-sm mt-2">
            <Trash2 size={15} /> Eliminar esta rutina
          </button>
        )}
      </div>
    </div>
  );
}
