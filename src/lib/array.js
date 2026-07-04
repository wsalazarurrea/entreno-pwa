/** Devuelve una copia del array con el elemento en `from` movido a `to`. */
export function arrayMove(arr, from, to){
  const a = [...arr];
  const [item] = a.splice(from, 1);
  a.splice(to, 0, item);
  return a;
}
