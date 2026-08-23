"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { reorderCategories } from "@/app/actions";
import { CategoryIcon } from "@/components/CategoryIcon";
import type { Category } from "@/core/types";

function CategoriaArrastavel({ category }: { category: Category }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: category.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center ${
        isDragging ? "z-10 border-accent bg-surface-muted opacity-90" : "border-transparent bg-surface-muted"
      }`}
    >
      {/* Alça própria em vez do cartão todo arrastável: mantém o toque
          "normal" disponível para o resto (aqui não há mais nada a fazer,
          mas evita o hábito de tornar tudo arrastável sem necessidade). */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="flex touch-none flex-col items-center gap-2 focus:outline-none"
        aria-label={`Arrastar para reordenar: ${category.name}`}
      >
        <div className="relative">
          <CategoryIcon icon={category.icon} color={category.color} size={18} />
          <GripVertical
            size={12}
            className="absolute -top-1.5 -right-1.5 rounded-full bg-surface text-foreground-muted"
          />
        </div>
        <span className="text-xs font-medium leading-tight">{category.name}</span>
      </button>
    </div>
  );
}

/**
 * Grelha de categorias em modo "reordenar" (ver QuickAddPanel.tsx) —
 * arrastar muda a posição logo no ecrã (otimista) e guarda em segundo
 * plano; se a Server Action falhar, volta à ordem anterior.
 */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  const [ordem, setOrdem] = useState(categories);
  const [erro, setErro] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function aoLargar(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over || active.id === over.id) return;

    const indiceAntigo = ordem.findIndex((c) => c.id === active.id);
    const indiceNovo = ordem.findIndex((c) => c.id === over.id);
    const novaOrdem = arrayMove(ordem, indiceAntigo, indiceNovo);
    const ordemAnterior = ordem;
    setOrdem(novaOrdem);
    setErro(null);

    startTransition(async () => {
      const resultado = await reorderCategories(novaOrdem.map((c) => c.id));
      if (!resultado.ok) {
        setOrdem(ordemAnterior);
        setErro(resultado.message ?? "Não foi possível guardar a nova ordem.");
      }
    });
  }

  return (
    <div>
      <DndContext sensors={sensores} onDragEnd={aoLargar}>
        <SortableContext items={ordem.map((c) => c.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {ordem.map((category) => (
              <CategoriaArrastavel key={category.id} category={category} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {erro && <p className="mt-2 text-xs text-danger">{erro}</p>}
    </div>
  );
}
