import { useEffect, useState } from "react";
import { notificationPermission, ensureNotificationPermission, testNotification, healthAvailable, healthConnect, estimateKcal, DEFAULT_SHORTCUT } from "../lib/native.js";
import { cx } from "../lib/cx.js";
import { Card } from "./ui/Card.jsx";
import { NumInput } from "./ui/NumInput.jsx";

const btnCls = "w-full py-3 flex items-center justify-center gap-2 border border-line rounded-xl text-[14px] font-semibold text-ink cursor-pointer bg-panel disabled:opacity-50";
const PERM_LABEL = { granted: "permitidos", denied: "bloqueados (actívalos en Ajustes de iOS → Entreno → Notificaciones)", prompt: "sin pedir", "prompt-with-rationale": "sin pedir" };

/** Ajustes propios de la app nativa de iPhone: avisos locales de descanso y Apple Salud. */
export function NativeSettings({ state, onChangeHealth }){
  const [perm, setPerm] = useState("…");
  const [testAt, setTestAt] = useState(null);
  const [health, setHealth] = useState({ available: null, msg: "" });
  const [kg, setKg] = useState(state.bodyKg ? String(state.bodyKg) : "");

  useEffect(() => {
    notificationPermission().then(setPerm).catch(() => setPerm("?"));
    healthAvailable().then(available => setHealth(h => ({ ...h, available })));
  }, []);

  const allow = async () => { await ensureNotificationPermission(); setPerm(await notificationPermission()); };
  const test = async (sec) => { if (await testNotification(sec)) setTestAt(Date.now() + sec * 1000); setPerm(await notificationPermission()); };
  const connect = async () => {
    setHealth(h => ({ ...h, msg: "Abriendo permisos de Salud…" }));
    try {
      const ok = await healthConnect();
      setHealth(h => ({ ...h, msg: ok ? "Conectado: Entreno puede guardar entrenamientos en Salud." : "Salud no dio permiso de escritura. Revísalo en Salud → Perfil → Apps → Entreno." }));
      if (ok && !state.healthSync) onChangeHealth({ healthSync: true });
    } catch (e) {
      const m = e?.message || String(e);
      setHealth(h => ({ ...h, msg: /healthkit entitlement/i.test(m) ? "Esta instalación (firma gratuita) no tiene permiso de Salud. Usa «Atajo de iOS»." : `Error: ${m}` }));
    }
  };
  const kcal = estimateKcal(3600, Number(kg.replace(",", ".")) || 0);
  const mode = state.healthMode || "atajo";
  const shortcutName = state.shortcutName ?? DEFAULT_SHORTCUT;

  return (
    <>
      <h3 className="font-bold mb-2 px-1">Avisos de descanso</h3>
      <Card className="p-4 mb-3.5">
        <div className="text-[13px] text-mut mb-2.5">Los genera el propio iPhone: llegan a la hora exacta aunque bloquees el teléfono, sin internet, y se ajustan al instante si usas −15, +15 u Omitir.</div>
        <div className="text-sm mb-2.5">Estado: <span className={cx("font-mono", perm === "granted" ? "text-teal" : "text-mut")}>{PERM_LABEL[perm] || perm}</span></div>
        {perm !== "granted" && <button type="button" onClick={allow} className={cx(btnCls, "bg-amber! text-white! border-transparent!")}>Permitir avisos</button>}
        <div className="mt-3 text-[13px] text-mut">Probar aviso (bloquea el teléfono después de tocarlo):</div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[10, 30, 60].map(sec => <button key={sec} type="button" onClick={() => test(sec)} className={btnCls}>{sec} s</button>)}
        </div>
        {testAt && <div className="mt-2 text-[13px] text-mut">Debe llegar a las <b className="text-ink font-mono">{new Date(testAt).toLocaleTimeString("es-CL", { hour12: false })}</b>.</div>}
      </Card>

      <h3 className="font-bold mb-2 px-1">Apple Salud</h3>
      <Card className="p-4 mb-5 flex flex-col gap-3">
        <div className="text-[13px] text-mut">Cada entrenamiento terminado se guarda en Salud como <b className="text-ink">Entrenamiento tradicional de fuerza</b> y aparece en la app Fitness.</div>

        <div className="flex bg-panel2 rounded-xl p-1">
          {[["atajo", "Atajo de iOS"], ["directo", "Directo"]].map(([k, l]) => (
            <button key={k} type="button" onClick={() => onChangeHealth({ healthMode: k })}
              className={cx("flex-1 py-2 rounded-lg text-[13.5px] font-semibold cursor-pointer", mode === k ? "bg-amber text-white shadow-sm" : "text-mut")}>{l}</button>
          ))}
        </div>

        {mode === "atajo" ? (
          <>
            <div className="text-[13px] text-mut">Con la instalación gratuita (SideStore) la app no puede escribir en Salud, pero la app <b className="text-ink">Atajos</b> sí. Entreno abre tu atajo, le pasa los minutos y vuelve sola.</div>
            <details className="text-[13px] text-ink bg-panel2 rounded-xl px-3 py-2.5">
              <summary className="font-semibold cursor-pointer">Cómo crear el atajo (una sola vez)</summary>
              <ol className="list-decimal pl-5 mt-2 flex flex-col gap-1.5 text-mut">
                <li>Abre <b className="text-ink">Atajos</b> → <b className="text-ink">+</b>. Toca el nombre arriba → <b className="text-ink">Renombrar</b> → escribe <b className="text-ink">{shortcutName}</b>.</li>
                <li>Agrega la acción <b className="text-ink">Ajustar fecha</b>. Déjala así: <b className="text-ink">Restar</b> · toca el número → <i>Seleccionar variable</i> → <b className="text-ink">Entrada del atajo</b> · <b className="text-ink">minutos</b> · de <b className="text-ink">Fecha actual</b>.</li>
                <li>Agrega la acción <b className="text-ink">Registrar entrenamiento</b>: tipo <b className="text-ink">Entrenamiento tradicional de fuerza</b>; <b className="text-ink">Fecha</b> → <b className="text-ink">Fecha ajustada</b>; en <b className="text-ink">Duración</b> toca el número → <b className="text-ink">Entrada del atajo</b> · <b className="text-ink">minutos</b>.</li>
                <li>Si arriba aparece «Recibir … de», deja que reciba <b className="text-ink">Texto</b>. Listo, toca OK.</li>
              </ol>
            </details>
            <div>
              <label className="text-[11px] font-medium text-mut mb-1 block">Nombre exacto del atajo</label>
              <input value={shortcutName} onChange={e => onChangeHealth({ shortcutName: e.target.value })}
                className="w-full px-3 py-2.5 bg-panel border border-line rounded-xl text-ink outline-none focus:border-amber" />
            </div>
            <div className="text-faint text-xs">Para probar: Historial → abre un entrenamiento → «Enviar a Apple Salud». Se registra con su duración, terminando en ese momento.</div>
          </>
        ) : health.available === false ? (
          <div className="text-[13px] text-coral">Salud no está disponible en este dispositivo.</div>
        ) : (
          <>
            <div className="text-[13px] text-mut">Escribe en Salud sin pasar por Atajos (hora real de inicio y calorías). Requiere que la app esté firmada con una cuenta de desarrollador pagada.</div>
            <button type="button" onClick={connect} className={btnCls}>❤️ Conectar con Apple Salud</button>
            {health.msg && <div className="text-[13px] text-mut">{health.msg}</div>}
            <div>
              <label className="text-[11px] font-medium text-mut mb-1 block">Tu peso corporal (kg), para estimar calorías</label>
              <NumInput decimal value={kg} placeholder="opcional"
                onChange={v => { setKg(v); const n = Number(v.replace(",", ".")); onChangeHealth({ bodyKg: n > 0 ? n : null }); }}
                className="h-11 bg-panel! border-line! text-left! px-3 font-normal!" />
              <div className="text-faint text-xs mt-1">{kcal ? `≈ ${kcal} kcal por hora de pesas (3,5 MET).` : "Sin peso no se envían calorías, sólo el entrenamiento."}</div>
            </div>
          </>
        )}

        <label className="flex items-center gap-2.5 text-[14px] cursor-pointer">
          <input type="checkbox" checked={!!state.healthSync} onChange={e => onChangeHealth({ healthSync: e.target.checked })} className="w-4 h-4 accent-[#ef6c2e]" />
          Guardar cada entrenamiento al terminar
        </label>
      </Card>
    </>
  );
}
