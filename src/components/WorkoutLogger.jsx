import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronDown, Ellipsis, Check, Plus, Timer, Volume2, VolumeX, Trash2, RefreshCw, ArrowUp, ArrowDown } from "lucide-react";
import { lastPerformance, SET_TYPES, isWorking } from "../lib/workouts.js";
import { suggestion, placeholderFor, parseNum, makeSessionExercise, sessionDiffersFromRoutine, incFor } from "../lib/training.js";
import { formatClock, formatRest, formatShort } from "../lib/dates.js";
import { scheduleRest } from "../lib/push-client.js";
import { arrayMove } from "../lib/array.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { StepInput } from "./ui/StepInput.jsx";
import { Sheet, SheetItem, ConfirmDialog } from "./ui/Sheet.jsx";
import { REST_OPTIONS } from "../lib/dates.js";
import { ExercisePicker } from "./ExercisePicker.jsx";

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const fmtSet = (s) => `${s.w ? s.w : "PC"}×${s.r ?? "–"}`;

/** Fila de serie: − [peso] + · − [reps] + · ✓. Desliza a la izquierda para eliminarla. */
function SetRow({ set, label, labelCls, ph, unit, wStep, err, onLabel, onChange, onToggle, onDelete }){
  const [dx, setDx] = useState(0);
  const st = useRef(null);
  const down = (e) => { st.current = { x: e.clientX, y: e.clientY, active: false }; };
  const move = (e) => {
    const t = st.current; if (!t) return;
    const ddx = e.clientX - t.x, ddy = e.clientY - t.y;
    if (!t.active) {
      if (Math.abs(ddx) > 12 && Math.abs(ddx) > Math.abs(ddy) * 1.5) t.active = true;
      else if (Math.abs(ddy) > 12) { st.current = null; return; }
      else return;
    }
    setDx(Math.min(0, Math.max(-140, ddx)));
  };
  const up = () => {
    const t = st.current; st.current = null;
    if (t?.active && dx < -90) { setDx(0); onDelete(); } else setDx(0);
  };
  return (
    <div className="relative overflow-hidden rounded-lg">
      {dx < 0 && <div className="absolute inset-0 bg-coral flex items-center justify-end pr-4 text-white text-sm font-semibold"><Trash2 size={16} className="mr-1.5" /> {dx < -90 ? "Suelta para eliminar" : "Eliminar"}</div>}
      <div
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        style={{ transform: `translateX(${dx}px)`, transition: dx ? "none" : "transform .18s", touchAction: "pan-y" }}
        className={cx("relative grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_38px] gap-1.5 items-center px-1 py-1.5", set.done ? "bg-[#e7f6f1]" : "bg-panel")}
      >
        <button type="button" onClick={onLabel} className={cx("h-9 rounded-md font-mono font-bold text-[14px] cursor-pointer active:bg-panel2", labelCls || "text-ink")}>{label}</button>
        <StepInput decimal value={set.w} placeholder={unit === "bw" ? "0" : ph.pw} step={wStep} onChange={v => onChange({ w: v })} aria-label="peso" />
        <StepInput value={set.r} placeholder={ph.pr} step={1} onChange={v => onChange({ r: v })} inputClassName={err ? "border-coral!" : ""} aria-label="repeticiones" />
        <button type="button" onClick={onToggle} aria-label={set.done ? "desmarcar" : "completar"}
          className={cx("w-9 h-9 justify-self-center rounded-lg grid place-items-center cursor-pointer transition-colors",
            set.done ? "bg-teal text-white" : "bg-panel2 text-faint")}>
          <Check size={18} strokeWidth={3} />
        </button>
      </div>
      {err && <div className="text-[11.5px] text-coral px-2 pb-1 bg-panel relative">Escribe las repeticiones de esta serie.</div>}
    </div>
  );
}

function ExerciseCard({ ex, last, sug, live, errKey, restDefault, wStep, onMenu, onRest, onSetMenu, onToggle, onSetChange, onDeleteSet, onAddSet, onNote, onUsePrev }){
  let n = 0;
  const sugCls = sug.kind === "up" ? "text-teal border-teal/40 bg-teal/10" : sug.kind === "hold" ? "text-amber border-amber/40 bg-amber/10" : "text-mut border-line bg-panel2";
  const rest = ex.rest ?? restDefault;
  const prevSets = last?.sets || [];
  return (
    <Card className="overflow-hidden">
      <div className="px-3.5 pt-3 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-bold text-[15.5px] text-amber leading-snug">{ex.name}</div>
            <div className="text-[12px] text-faint font-mono mt-0.5">meta {ex.lo}–{ex.hi} reps{ex.unit === "kg/mano" ? " · kg por mano" : ex.unit === "kg/lado" ? " · kg por lado" : ex.unit === "bw" ? " · peso corporal" : ""}</div>
          </div>
          <button type="button" onClick={onMenu} aria-label="opciones del ejercicio" className="w-9 h-9 -mr-1.5 rounded-lg grid place-items-center text-mut cursor-pointer active:bg-panel2 shrink-0"><Ellipsis size={20} /></button>
        </div>
        {ex.note && <div className="mt-1.5 text-[12.5px] text-mut italic">{ex.note}</div>}
        {prevSets.length > 0 && (
          <button type="button" onClick={onUsePrev} className="mt-1.5 block text-left text-[12.5px] cursor-pointer">
            <span className="text-faint">Anterior ({formatShort(last.date)}): </span>
            <span className="font-mono text-mut">{prevSets.map(fmtSet).join(" · ")}</span>
          </button>
        )}
        {live && <div className={cx("mt-2 inline-block text-[12px] rounded-md border px-2 py-1", sugCls)}>▸ {sug.msg}</div>}
        <input value={ex.userNote} onChange={e => onNote(e.target.value)} placeholder="Agregar nota…"
          className="mt-2 w-full bg-transparent outline-none text-ink placeholder:text-faint py-1" />
        <button type="button" onClick={onRest} className="mt-0.5 flex items-center gap-1.5 text-[13px] font-medium text-amber cursor-pointer">
          <Timer size={15} /> Descanso: {rest ? formatRest(rest) : "apagado"}{ex.rest == null ? "" : " (este ejercicio)"}
        </button>
      </div>
      <div className="px-1.5 pb-2">
        <div className="grid grid-cols-[28px_minmax(0,1fr)_minmax(0,1fr)_38px] gap-1.5 px-1 pb-1 text-faint text-[11px] font-semibold tracking-wide text-center">
          <span>SERIE</span><span>{ex.unit === "bw" ? "LASTRE KG" : "KG"}</span><span>REPS</span><span><Check size={13} className="mx-auto" /></span>
        </div>
        {ex.sets.length === 0 && ex.agg && (
          <div className="px-2 py-2 text-[12.5px] text-faint">Del historial base: sólo hay totales (máx {ex.agg.tw || "PC"} kg · e1RM {Math.round(ex.agg.e1rm)}). Agrega series si quieres detallarlo.</div>
        )}
        <div className="flex flex-col gap-1">
          {ex.sets.map((s, si) => {
            const t = SET_TYPES[s.type] || SET_TYPES.normal;
            if (isWorking(s)) n++;
            const ph = placeholderFor(ex, si, last, sug);
            return (
              <SetRow key={s.key} set={s} unit={ex.unit} wStep={wStep}
                label={t.short || n} labelCls={t.cls}
                ph={ph} err={errKey === s.key}
                onLabel={() => onSetMenu(si)}
                onChange={(patch) => onSetChange(si, patch)}
                onToggle={() => onToggle(si)}
                onDelete={() => onDeleteSet(si)} />
            );
          })}
        </div>
        <button type="button" onClick={onAddSet} className="w-full mt-1.5 py-2 rounded-lg bg-panel2 text-ink text-[14px] font-semibold cursor-pointer flex items-center justify-center gap-1.5">
          <Plus size={16} /> Agregar serie
        </button>
      </div>
    </Card>
  );
}

/** Registro de un entrenamiento: en vivo (mode "live") o editando uno pasado
 * (mode "edit"). Cada cambio sube por onChange(updater) y App lo persiste. */
export function WorkoutLogger({ session, state, catalog, recent, onChange, onMinimize, onFinish, onDiscard, onCreateCustom }){
  const live = session.mode !== "edit";
  const restDefault = state.restSeconds;
  const [now, setNow] = useState(Date.now());
  const [soundOn, setSoundOn] = useState(true);
  const [menu, setMenu] = useState(null);     // { type: "exercise"|"set"|"rest", ei, si? }
  const [picker, setPicker] = useState(null); // { mode: "add" } | { mode: "replace", ei }
  const [dialog, setDialog] = useState(null); // "finish" | "empty" | "discard" | { type: "removeEx", ei }
  const [updateRoutine, setUpdateRoutine] = useState(false);
  const [errKey, setErrKey] = useState(null);
  const initialRef = useRef(JSON.stringify(session));
  const audioRef = useRef(null), wakeRef = useRef(null);

  const update = (fn) => onChange(fn);
  const updEx = (ei, fn) => update(s => ({ ...s, exercises: s.exercises.map((e, i) => i === ei ? fn(e) : e) }));
  const updSet = (ei, si, patch) => updEx(ei, e => ({ ...e, sets: e.sets.map((x, j) => j === si ? { ...x, ...patch } : x) }));

  const namesKey = session.exercises.map(e => e.name).join("|");
  const lasts = useMemo(() => session.exercises.map(e => lastPerformance(state.workouts, e.name, session.workoutId)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [namesKey, state.workouts, session.workoutId]);
  const sugs = session.exercises.map((e, i) => suggestion(e, lasts[i], state.customExercises));

  /* ---- reloj, descanso, sonido ---- */
  function ensureAudio(){ try{ if(!audioRef.current){ const AC=window.AudioContext||window.webkitAudioContext; audioRef.current=new AC(); } if(audioRef.current.state==="suspended") audioRef.current.resume(); }catch{ /* sin audio */ } }
  function beep(){
    if(soundOn){ try{ const ctx=audioRef.current; if(ctx){ const t0=ctx.currentTime; [0,0.28,0.56].forEach((off,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.type="sine"; o.frequency.value=660+i*220; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.0001,t0+off); g.gain.exponentialRampToValueAtTime(0.5,t0+off+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+off+0.22); o.start(t0+off); o.stop(t0+off+0.24); }); } }catch{ /* sin audio */ } }
    try{ navigator.vibrate?.([200,100,200]); }catch{ /* sin vibración */ }
  }
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  useEffect(() => {
    if (!live) return;
    const acquire = async () => { try { if ("wakeLock" in navigator) wakeRef.current = await navigator.wakeLock.request("screen"); } catch { /* opcional */ } };
    acquire();
    const onVis = () => { if (document.visibilityState === "visible") { acquire(); setNow(Date.now()); try { if (audioRef.current?.state === "suspended") audioRef.current.resume(); } catch { /* */ } } };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); try { wakeRef.current?.release(); } catch { /* */ } };
  }, [live]);
  useEffect(() => {
    if (session.restEnd && now >= session.restEnd) {
      if (now - session.restEnd < 4000) beep(); // si vuelves tarde a la app no suena de golpe
      update(s => ({ ...s, restEnd: null }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, session.restEnd]);

  const startRest = (sec) => { update(s => ({ ...s, restEnd: Date.now() + sec * 1000, restTotal: sec })); scheduleRest(sec); };
  const adjustRest = (d) => update(s => s.restEnd ? { ...s, restEnd: Math.max(Date.now() + 1000, s.restEnd + d * 1000), restTotal: Math.max(1, (s.restTotal || 0) + d) } : s);
  const restLeft = session.restEnd ? Math.max(0, Math.ceil((session.restEnd - now) / 1000)) : null;

  /* ---- series ---- */
  const toggle = (ei, si) => {
    const e = session.exercises[ei], s = e.sets[si];
    if (s.done) return updSet(ei, si, { done: false });
    const { pw, pr } = placeholderFor(e, si, lasts[ei], sugs[ei]);
    const w = s.w !== "" ? s.w : pw, r = s.r !== "" ? s.r : pr;
    if (parseNum(r) == null) { setErrKey(s.key); return; }
    setErrKey(null);
    updSet(ei, si, { w, r, done: true });
    ensureAudio();
    if (live && isWorking(s)) { const sec = e.rest ?? restDefault; if (sec > 0) startRest(sec); }
  };
  const addSet = (ei) => updEx(ei, e => ({ ...e, sets: [...e.sets, { key: Math.random().toString(36).slice(2), w: "", r: "", type: "normal", done: false }] }));
  /** Copia lo de la vez anterior en las series aún no marcadas (crea las que falten). */
  const copyPrevious = (ei) => updEx(ei, e => {
    const prev = lasts[ei]?.sets || [];
    const str = (v) => (v == null ? "" : String(v));
    const sets = e.sets.map((x, j) => x.done || !prev[j] ? x : { ...x, w: str(prev[j].w), r: str(prev[j].r), type: prev[j].type || x.type });
    for (let j = e.sets.length; j < prev.length; j++) sets.push({ key: Math.random().toString(36).slice(2), w: str(prev[j].w), r: str(prev[j].r), type: prev[j].type || "normal", done: false });
    return { ...e, sets };
  });
  const deleteSet = (ei, si) => updEx(ei, e => ({ ...e, sets: e.sets.filter((_, j) => j !== si) }));

  /* ---- ejercicios ---- */
  const addExercises = (names) => update(s => ({ ...s, exercises: [...s.exercises, ...names.map(n => makeSessionExercise({ name: n, sets: 3 }, state))] }));
  const replaceExercise = (ei, name) => updEx(ei, old => makeSessionExercise({ name, sets: old.sets.length || 3, lo: old.lo, hi: old.hi, rest: old.rest }, state));
  const moveExercise = (ei, d) => update(s => ({ ...s, exercises: arrayMove(s.exercises, ei, ei + d) }));
  const removeExercise = (ei) => update(s => ({ ...s, exercises: s.exercises.filter((_, i) => i !== ei) }));

  /* ---- totales ---- */
  const doneSets = session.exercises.flatMap(e => e.sets.filter(s => s.done));
  const totalSets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
  const volume = session.exercises.reduce((a, e) => a + e.sets.filter(s => s.done && isWorking(s)).reduce((b, s) => b + (parseNum(s.w) || 0) * (parseNum(s.r) || 0), 0), 0);
  const elapsed = live ? Math.floor((now - session.startedAt) / 1000) : (session.durationSec || 0);
  const routine = state.routines.find(r => r.id === session.routineId);
  const differs = live && routine && sessionDiffersFromRoutine(session, routine);
  const hasAgg = session.exercises.some(e => e.agg && !e.sets.length);
  const dirty = JSON.stringify(session) !== initialRef.current;

  const onFinishClick = () => {
    if (live) return setDialog(doneSets.length ? "finish" : "empty");
    if (!doneSets.length && !hasAgg) return setDialog("empty");
    onFinish({ updateRoutine: false });
  };

  const exMenu = menu?.type === "exercise" ? session.exercises[menu.ei] : null;
  const setMenuEx = menu?.type === "set" ? session.exercises[menu.ei] : null;
  const restEx = menu?.type === "rest" ? session.exercises[menu.ei] : null;

  return (
    <div className="pb-44">
      <div className="sticky-top z-20 bg-bg/95 backdrop-blur border-b border-line px-3 py-2.5 flex items-center justify-between gap-2">
        {live ? (
          <button type="button" onClick={onMinimize} className="flex items-center gap-1 text-mut text-sm cursor-pointer px-1 py-1.5" aria-label="minimizar">
            <ChevronDown size={22} />
          </button>
        ) : (
          <button type="button" onClick={() => dirty ? setDialog("discard") : onDiscard()} className="text-mut text-sm cursor-pointer px-1 py-1.5">Cancelar</button>
        )}
        <div className="text-center min-w-0">
          <div className="font-mono font-bold text-[17px] tabular-nums leading-tight">{live ? formatClock(elapsed) : "Editar entrenamiento"}</div>
          {live && <div className="text-[11px] text-faint">duración</div>}
        </div>
        <div className="flex items-center gap-1.5">
          {live && (
            <button type="button" onClick={() => { ensureAudio(); setSoundOn(s => !s); }} aria-label="sonido"
              className={cx("w-9 h-9 grid place-items-center rounded-lg cursor-pointer", soundOn ? "text-amber" : "text-faint")}>
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          )}
          <button type="button" onClick={onFinishClick} className="bg-teal text-white rounded-lg px-3.5 py-2 font-bold text-sm cursor-pointer">
            {live ? "Terminar" : "Guardar"}
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3.5">
        <div>
          <input value={session.title} onChange={e => update(s => ({ ...s, title: e.target.value }))} placeholder="Nombre del entrenamiento"
            className="w-full bg-transparent outline-none font-extrabold text-[22px]! tracking-tight" />
          <div className="flex gap-5 mt-1 text-[13px]">
            {!live && (
              <label className="flex flex-col"><span className="text-faint text-[11px]">Fecha</span>
                <input type="date" value={session.date} onChange={e => e.target.value && update(s => ({ ...s, date: e.target.value }))} className="bg-transparent outline-none font-mono text-ink" />
              </label>
            )}
            <div><div className="text-faint text-[11px]">Volumen</div><div className="font-mono font-semibold">{Math.round(volume).toLocaleString("es")} kg</div></div>
            <div><div className="text-faint text-[11px]">Series</div><div className="font-mono font-semibold">{doneSets.length}/{totalSets}</div></div>
          </div>
        </div>

        {session.exercises.length === 0 && (
          <Card className="p-6 text-center text-mut text-sm">Empieza agregando un ejercicio.</Card>
        )}

        {session.exercises.map((ex, ei) => (
          <ExerciseCard key={ex.key} ex={ex} last={lasts[ei]} sug={sugs[ei]} live={live} errKey={errKey} restDefault={restDefault}
            wStep={incFor(ex, state.customExercises) || 2.5}
            onMenu={() => setMenu({ type: "exercise", ei })}
            onRest={() => setMenu({ type: "rest", ei })}
            onSetMenu={(si) => setMenu({ type: "set", ei, si })}
            onToggle={(si) => toggle(ei, si)}
            onSetChange={(si, patch) => { if (errKey) setErrKey(null); updSet(ei, si, patch); }}
            onDeleteSet={(si) => deleteSet(ei, si)}
            onAddSet={() => addSet(ei)}
            onNote={(v) => updEx(ei, e => ({ ...e, userNote: v }))}
            onUsePrev={() => copyPrevious(ei)}
          />
        ))}

        <button type="button" onClick={() => setPicker({ mode: "add" })}
          className="w-full py-3.5 rounded-xl bg-amber text-white font-bold cursor-pointer flex items-center justify-center gap-2">
          <Plus size={18} /> Agregar ejercicio
        </button>

        <textarea value={session.notes} onChange={e => update(s => ({ ...s, notes: e.target.value }))} rows={2}
          placeholder="Notas del entrenamiento (cómo te sentiste, molestias…)"
          className="w-full px-3 py-2.5 bg-panel border border-line rounded-xl outline-none focus:border-amber resize-none" />

        {live && (
          <button type="button" onClick={() => setDialog("discard")}
            className="w-full py-3 rounded-xl border border-coral/40 text-coral font-semibold cursor-pointer">
            Descartar entrenamiento
          </button>
        )}
      </div>

      {live && restLeft != null && (
        <div className="fixed left-0 right-0 bottom-0 z-30 bg-panel border-t border-line pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="h-1 bg-line"><div className="h-full bg-amber transition-[width] duration-500" style={{ width: `${Math.min(100, (restLeft / Math.max(1, session.restTotal || 1)) * 100)}%` }} /></div>
          <div className="flex items-center gap-2 px-4 pt-2.5">
            <button type="button" onClick={() => adjustRest(-15)} className="w-14 py-2.5 rounded-lg bg-panel2 font-mono font-semibold cursor-pointer">−15</button>
            <div className="flex-1 text-center">
              <div className="text-[11px] text-faint">Descanso</div>
              <div className="font-mono font-bold text-[26px] leading-none tabular-nums">{formatClock(restLeft)}</div>
            </div>
            <button type="button" onClick={() => adjustRest(15)} className="w-14 py-2.5 rounded-lg bg-panel2 font-mono font-semibold cursor-pointer">+15</button>
            <button type="button" onClick={() => update(s => ({ ...s, restEnd: null }))} className="px-3.5 py-2.5 rounded-lg bg-amber text-white font-bold cursor-pointer">Omitir</button>
          </div>
        </div>
      )}

      {/* ---- menús ---- */}
      <Sheet open={!!exMenu} onClose={() => setMenu(null)} title={exMenu?.name}>
        <SheetItem icon={RefreshCw} onClick={() => { setPicker({ mode: "replace", ei: menu.ei }); setMenu(null); }}>Reemplazar ejercicio</SheetItem>
        {menu?.ei > 0 && <SheetItem icon={ArrowUp} onClick={() => { moveExercise(menu.ei, -1); setMenu(null); }}>Mover arriba</SheetItem>}
        {menu?.ei < session.exercises.length - 1 && <SheetItem icon={ArrowDown} onClick={() => { moveExercise(menu.ei, 1); setMenu(null); }}>Mover abajo</SheetItem>}
        <SheetItem icon={Trash2} danger onClick={() => {
          const ei = menu.ei; setMenu(null);
          if (session.exercises[ei].sets.some(s => s.done)) setDialog({ type: "removeEx", ei }); else removeExercise(ei);
        }}>Quitar ejercicio</SheetItem>
      </Sheet>

      <Sheet open={!!setMenuEx} onClose={() => setMenu(null)} title="Tipo de serie">
        {Object.entries(SET_TYPES).map(([k, t]) => (
          <SheetItem key={k} active={setMenuEx?.sets[menu.si]?.type === k} onClick={() => { updSet(menu.ei, menu.si, { type: k }); setMenu(null); }}>
            <span className={cx("inline-block w-6 font-mono font-bold", t.cls)}>{t.short || "1"}</span>{t.label}
          </SheetItem>
        ))}
        <SheetItem icon={Trash2} danger onClick={() => { deleteSet(menu.ei, menu.si); setMenu(null); }}>Eliminar serie</SheetItem>
      </Sheet>

      <Sheet open={!!restEx} onClose={() => setMenu(null)} title={restEx ? `Descanso · ${restEx.name}` : ""}>
        <SheetItem active={restEx?.rest == null} onClick={() => { updEx(menu.ei, e => ({ ...e, rest: null })); setMenu(null); }}>
          Predeterminado ({formatRest(restDefault)})
        </SheetItem>
        {REST_OPTIONS.map(sec => (
          <SheetItem key={sec} active={restEx?.rest === sec} onClick={() => { updEx(menu.ei, e => ({ ...e, rest: sec })); setMenu(null); }}>
            {sec ? `${formatRest(sec)} min` : "Apagado"}
          </SheetItem>
        ))}
      </Sheet>

      {/* ---- confirmaciones ---- */}
      <ConfirmDialog open={dialog === "finish"} title="¿Terminar entrenamiento?"
        message={`${plural(doneSets.length, "serie completada", "series completadas")}.${totalSets - doneSets.length ? ` ${plural(totalSets - doneSets.length, "serie sin marcar no se guardará", "series sin marcar no se guardarán")}.` : ""}`}
        confirmLabel="Terminar y guardar" cancelLabel="Seguir entrenando"
        onCancel={() => setDialog(null)} onConfirm={() => { setDialog(null); onFinish({ updateRoutine: differs && updateRoutine }); }}>
        {differs && (
          <label className="mt-3 flex items-start gap-2.5 text-[14px] cursor-pointer">
            <input type="checkbox" checked={updateRoutine} onChange={e => setUpdateRoutine(e.target.checked)} className="mt-1 w-4 h-4 accent-[#ef6c2e]" />
            <span>Actualizar la rutina «{routine.title}» con los cambios de hoy (ejercicios, orden, series y descansos).</span>
          </label>
        )}
      </ConfirmDialog>

      <ConfirmDialog open={dialog === "empty"} title="No hay series completadas"
        message={live ? "Marca con ✓ las series que hiciste. Si no hiciste nada, puedes descartar el entrenamiento." : "El entrenamiento quedaría vacío. Márcalas con ✓ o elimínalo desde el historial."}
        confirmLabel={live ? "Descartar entrenamiento" : "Entendido"} danger={live} cancelLabel="Volver"
        onCancel={() => setDialog(null)} onConfirm={() => { setDialog(null); if (live) onDiscard(); }} />

      <ConfirmDialog open={dialog === "discard"} title={live ? "¿Descartar entrenamiento?" : "¿Descartar cambios?"}
        message={live ? "Se perderá todo lo registrado en esta sesión." : "Los cambios que hiciste no se guardarán."}
        confirmLabel="Descartar" danger cancelLabel="Volver"
        onCancel={() => setDialog(null)} onConfirm={() => { setDialog(null); onDiscard(); }} />

      <ConfirmDialog open={dialog?.type === "removeEx"} title="¿Quitar ejercicio?"
        message={dialog?.type === "removeEx" ? `${session.exercises[dialog.ei]?.name} tiene series completadas que se perderán.` : ""}
        confirmLabel="Quitar" danger
        onCancel={() => setDialog(null)} onConfirm={() => { removeExercise(dialog.ei); setDialog(null); }} />

      {picker && (
        <ExercisePicker
          title={picker.mode === "add" ? "Agregar ejercicios" : "Reemplazar ejercicio"}
          multi={picker.mode === "add"} catalog={catalog} recent={recent} onCreateCustom={onCreateCustom}
          onCancel={() => setPicker(null)}
          onPick={(names) => { if (picker.mode === "add") addExercises(names); else replaceExercise(picker.ei, names[0]); setPicker(null); }} />
      )}
    </div>
  );
}
