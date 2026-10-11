import { useEffect, useRef, useState } from "react";
import { RotateCcw, FileUp, Download, Upload } from "lucide-react";
import { getSubscription, subscribePush, isStandalone, scheduleRest } from "../lib/push-client.js";
import { parseHevyCSV } from "../lib/hevyImport.js";
import { localDate, formatDay } from "../lib/dates.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { RestSelect } from "./ui/RestSelect.jsx";
import { ConfirmDialog } from "./ui/Sheet.jsx";
import { NativeSettings } from "./NativeSettings.jsx";
import { isNative, shareBackupNative } from "../lib/native.js";

/* global __APP_VERSION__ -- inyectado por vite.config.js (define) */
const APP_VERSION = __APP_VERSION__;
const builtAtLabel = new Date(APP_VERSION.builtAt).toLocaleString("es", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });

const inputCls = "w-full px-3 py-2.5 bg-panel border border-line rounded-xl text-ink outline-none focus:border-amber";
const btnCls = "w-full py-3 flex items-center justify-center gap-2 border border-line rounded-xl text-[14px] font-semibold text-ink cursor-pointer bg-panel";

async function shareOrDownload(filename, text){
  const file = new File([text], filename, { type: "application/json" });
  try{
    if(navigator.canShare?.({ files:[file] })){ await navigator.share({ files:[file], title:filename }); return; }
  }catch(e){ if(e?.name === "AbortError") return; }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a"); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function Settings({ state, onChangeProgram, onChangeRest, onChangeHealth, onReset, onImportHevy, onRestore }){
  const [status, setStatus] = useState(getSubscription() ? "activo" : "inactivo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null); // { kind: "hevy", workouts } | { kind: "backup", data } | { kind: "reset" }
  const [msg, setMsg] = useState("");
  const csvRef = useRef(null), backupRef = useRef(null);

  const [test, setTest] = useState(null); // { at } | { error }
  const [, tick] = useState(0);
  useEffect(() => { if (!test?.at) return; const t = setInterval(() => tick(x => x + 1), 500); return () => clearInterval(t); }, [test]);
  const probar = async (secs) => {
    setTest({ pending: true });
    const at = Date.now() + secs * 1000;
    const ok = await scheduleRest(secs, { title: "Prueba de aviso", body: "Los avisos funcionan ✅", test: true });
    setTest(ok ? { at } : { error: "No se pudo programar el aviso (sin conexión con el servidor de avisos)." });
  };
  const left = test?.at ? Math.ceil((test.at - Date.now()) / 1000) : null;
  const activar = async () => {
    setBusy(true); setError("");
    try{ await subscribePush(); setStatus("activo"); }
    catch(e){ setError(e.message || "No se pudo activar"); }
    finally{ setBusy(false); }
  };

  const readFile = (e, fn) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if(!f) return;
    setMsg("");
    f.text().then(fn).catch(err => setMsg(err.message || "No se pudo leer el archivo."));
  };
  const onCsv = (e) => readFile(e, text => setPending({ kind:"hevy", workouts: parseHevyCSV(text) }));
  const onBackup = (e) => readFile(e, text => {
    let data; try{ data = JSON.parse(text); }catch{ throw new Error("El archivo no es un respaldo válido."); }
    if(!data || !Array.isArray(data.routines)) throw new Error("El archivo no es un respaldo de esta app.");
    setPending({ kind:"backup", data });
  });
  const exportBackup = () => {
    const name = `entreno-respaldo-${localDate()}.json`, text = JSON.stringify(state);
    if (isNative) shareBackupNative(name, text).catch(e => setMsg(e?.message || "No se pudo exportar."));
    else shareOrDownload(name, text);
  };

  const appCount = state.workouts.filter(w => w.source === "app").length;
  const hevyWs = pending?.kind === "hevy" ? pending.workouts : [];

  return (
    <div className="p-4 pb-24">
      <div className="text-mut text-[13px] mb-4">Personaliza tu programa y los avisos de descanso.</div>

      <Card className="p-4 mb-3.5 flex flex-col gap-4">
        <div>
          <label className="text-[11px] font-medium text-mut mb-1 block">Nombre del programa</label>
          <input className={inputCls} value={state.programName}
            onChange={e => onChangeProgram(e.target.value)} placeholder="Mi entrenamiento" />
          <div className="text-faint text-xs mt-1">Aparece en la cabecera de la app.</div>
        </div>
        <div>
          <label className="text-[11px] font-medium text-mut mb-1 block">Descanso predeterminado entre series</label>
          <RestSelect value={state.restSeconds} onChange={v => onChangeRest(v ?? 0)} className="w-full" />
          <div className="text-faint text-xs mt-1">Cada ejercicio puede tener su propio descanso (en la rutina o durante el entrenamiento).</div>
        </div>
      </Card>

      {isNative ? <NativeSettings state={state} onChangeHealth={onChangeHealth} /> : (<>
      <div className="text-mut text-[13px] mb-2 px-1">Aviso de descanso en segundo plano (push), aunque el teléfono esté bloqueado o estés en otra app.</div>
      {!isStandalone() && (
        <Card className="bg-coral/10! border-coral/40! p-3.5 mb-3.5 text-[13px] text-ink">
          Para que los avisos funcionen en iPhone, abre esta app desde el ícono en tu pantalla de inicio (Compartir → Agregar a inicio), no desde una pestaña de Safari.
        </Card>
      )}
      <Card className="p-4 mb-5">
        <div className="mb-2.5 text-sm">Estado: <span className={cx("font-mono", status==="activo" ? "text-teal" : "text-mut")}>{status}</span></div>
        <button onClick={activar} disabled={busy}
          className={cx("w-full rounded-xl font-bold cursor-pointer disabled:opacity-60", status==="activo" ? "py-2.5 bg-panel2 text-ink text-[14px]" : "py-3.5 bg-amber text-white text-[15px]")}>
          {busy ? "Activando…" : status==="activo" ? "Reactivar avisos" : "Activar avisos en segundo plano"}
        </button>
        {error && <div className="mt-2 text-coral text-[13px]">{error}</div>}
        {status==="activo" && (
          <>
            <div className="mt-3 text-[13px] text-mut">Probar aviso: tócalo y bloquea el teléfono. El aviso dirá a qué hora debía llegar y a qué hora llegó.</div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[10, 30, 60].map(sec => (
                <button key={sec} type="button" onClick={() => probar(sec)} disabled={test?.pending} className={cx(btnCls, "disabled:opacity-50")}>{sec} s</button>
              ))}
            </div>
            {test?.error && <div className="mt-2 text-[13px] text-coral">{test.error}</div>}
            {test?.at && (
              <div className="mt-2 text-[13px] text-mut">
                Debe llegar a las <b className="text-ink font-mono">{new Date(test.at).toLocaleTimeString("es-CL", { hour12: false })}</b>
                {left > 0 ? <> (en <span className="font-mono">{left} s</span>)</> : " — ya debería haber llegado."}
              </div>
            )}
          </>
        )}
      </Card>
      </>)}

      <h3 className="font-bold mb-2 px-1">Tus datos</h3>
      <Card className="p-4 mb-3.5 flex flex-col gap-2.5">
        <div className="text-[13px] text-mut">
          <b className="text-ink">Importar historial de Hevy.</b> En Hevy: Perfil → Ajustes → Exportar e importar datos → Exportar entrenamientos. Elige aquí ese archivo .csv para traer todas tus series con detalle.
        </div>
        <input ref={csvRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onCsv} />
        <button type="button" onClick={() => csvRef.current?.click()} className={btnCls}><FileUp size={16} /> Importar CSV de Hevy</button>
        <div className="h-px bg-line my-1" />
        <div className="text-[13px] text-mut">
          <b className="text-ink">Respaldo.</b> {isNative ? "Para pasar tus datos desde la versión web: en la web toca Exportar respaldo y aquí Restaurar respaldo." : "Tus datos viven sólo en este teléfono: si borras la app del inicio, se pierden. Guarda un respaldo de vez en cuando."}
        </div>
        <button type="button" onClick={exportBackup} className={btnCls}><Download size={16} /> Exportar respaldo</button>
        <input ref={backupRef} type="file" accept=".json,application/json" className="hidden" onChange={onBackup} />
        <button type="button" onClick={() => backupRef.current?.click()} className={btnCls}><Upload size={16} /> Restaurar respaldo</button>
        {msg && <div className="text-[13px] text-coral">{msg}</div>}
      </Card>

      <Card className="p-4">
        <div className="text-sm font-semibold mb-2.5">Zona de riesgo</div>
        <button onClick={() => setPending({ kind:"reset" })} className="w-full py-3 flex items-center justify-center gap-2 border border-coral/40 text-coral rounded-xl text-sm cursor-pointer">
          <RotateCcw size={15}/> Reiniciar historial y rutinas
        </button>
        <div className="text-faint text-xs mt-2">Restaura las rutinas y el historial base importado de Hevy, y borra los entrenamientos y rutinas que creaste en la app.</div>
      </Card>

      <div className="text-faint text-xs text-center mt-5 px-2">
        <div>Versión <span className="font-mono text-mut">{APP_VERSION.commit}{APP_VERSION.dirty && "+cambios"}</span>{isNative ? " · app iPhone" : ""} · compilada {builtAtLabel}</div>
        {APP_VERSION.subject && <div className="mt-0.5 truncate">{APP_VERSION.subject}</div>}
      </div>

      <ConfirmDialog open={pending?.kind === "hevy"} title="Importar historial de Hevy"
        message={hevyWs.length ? `${hevyWs.length} entrenamientos, del ${formatDay(hevyWs.at(-1).date)} al ${formatDay(hevyWs[0].date)}. Reemplazan el historial de Hevy que ya estaba en la app; tus ${appCount} entrenamientos registrados aquí se conservan.` : ""}
        confirmLabel="Importar" onCancel={() => setPending(null)}
        onConfirm={() => { onImportHevy(hevyWs); setPending(null); setMsg(""); }} />

      <ConfirmDialog open={pending?.kind === "backup"} title="¿Restaurar respaldo?"
        message="Se reemplazan todos los datos actuales de la app (rutinas, historial y ajustes) por los del respaldo."
        confirmLabel="Restaurar" danger onCancel={() => setPending(null)}
        onConfirm={() => { onRestore(pending.data); setPending(null); }} />

      <ConfirmDialog open={pending?.kind === "reset"} title="¿Reiniciar todo?"
        message="Se restauran las rutinas y el historial base, y se borran los entrenamientos y rutinas que creaste aquí. Exporta un respaldo antes si no estás seguro."
        confirmLabel="Reiniciar" danger onCancel={() => setPending(null)}
        onConfirm={() => { onReset(); setPending(null); }} />
    </div>
  );
}
