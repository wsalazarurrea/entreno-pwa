import {
  DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/** Lista ordenable por arrastre. `ids` es el orden actual de identificadores;
 * `onReorder(fromIndex, toIndex)` se llama al soltar. Táctil + puntero + teclado. */
export function SortableList({ ids, onReorder, children }){
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 160, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      onReorder(ids.indexOf(active.id), ids.indexOf(over.id));
    }
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** Render-prop: entrega `setNodeRef`, `style`, `handleProps` (para el asa de
 * arrastre) e `isDragging`. Attach `handleProps` sólo al asa para que el resto
 * (inputs) siga siendo interactivo. */
export function SortableItem({ id, children }){
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    position: "relative",
  };
  return children({ setNodeRef, style, handleProps: { ...attributes, ...listeners }, isDragging });
}
