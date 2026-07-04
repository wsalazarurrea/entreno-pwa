import { cx } from "../../lib/cx.js";
import { ACCENT } from "./accent.js";

export function Tag({ accent="amber", children, className }){
  const a = ACCENT[accent] || ACCENT.amber;
  return (
    <span className={cx("font-mono text-[11px] tracking-wider rounded-md border px-2 py-0.5 whitespace-nowrap", a.text, a.borderSoft, className)}>
      {children}
    </span>
  );
}
