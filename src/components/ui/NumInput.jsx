import { cx } from "../../lib/cx.js";

/** Campo numérico que abre el teclado numérico del teléfono. Guarda el texto
 * tal cual (acepta coma o punto decimal); se convierte a número al guardar. */
export function NumInput({ value, onChange, decimal = false, className, ...rest }){
  const clean = (v) => decimal
    ? v.replace(/[^\d.,]/g, "").replace(/([.,].*)[.,]/g, "$1")
    : v.replace(/\D/g, "");
  return (
    <input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      autoComplete="off"
      value={value ?? ""}
      onChange={e => onChange(clean(e.target.value))}
      onFocus={e => e.target.select()}
      className={cx("w-full min-w-0 text-center font-mono font-semibold tabular-nums bg-panel2 rounded-lg outline-none border border-transparent focus:border-amber placeholder:text-faint placeholder:font-normal", className)}
      {...rest}
    />
  );
}
