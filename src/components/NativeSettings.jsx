import { useEffect, useState } from "react";
import { notificationPermission, ensureNotificationPermission, testNotification, healthAvailable, healthConnect, estimateKcal } from "../lib/native.js";
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
    } catch (e) { setHealth(h => ({ ...h, msg: `Error: ${e?.message || e}` })); }
  };
  const kcal = estimateKcal(3600, Number(kg.replace(",", ".")) || 0);

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
        {health.available === false ? (
          <div className="text-[13px] text-coral">Salud no está disponible en este dispositivo.</div>
        ) : (
          <>
            <div className="text-[13px] text-mut">Cada entrenamiento terminado se guarda en Salud como <b className="text-ink">Fuerza tradicional</b> (hora de inicio, duración y calorías estimadas) y aparece en la app Fitness.</div>
            <button type="button" onClick={connect} className={btnCls}>❤️ Conectar con Apple Salud</button>
            {health.msg && <div className="text-[13px] text-mut">{health.msg}</div>}
            <label className="flex items-center gap-2.5 text-[14px] cursor-pointer">
              <input type="checkbox" checked={!!state.healthSync} onChange={e => onChangeHealth({ healthSync: e.target.checked })} className="w-4 h-4 accent-[#ef6c2e]" />
              Guardar cada entrenamiento al terminar
            </label>
            <div>
              <label className="text-[11px] font-medium text-mut mb-1 block">Tu peso corporal (kg), para estimar calorías</label>
              <NumInput decimal value={kg} placeholder="opcional"
                onChange={v => { setKg(v); const n = Number(v.replace(",", ".")); onChangeHealth({ bodyKg: n > 0 ? n : null }); }}
                className="h-11 bg-panel! border-line! text-left! px-3 font-normal!" />
              <div className="text-faint text-xs mt-1">{kcal ? `≈ ${kcal} kcal por hora de pesas (3,5 MET).` : "Sin peso no se envían calorías, sólo el entrenamiento."}</div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
