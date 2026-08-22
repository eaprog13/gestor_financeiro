import { getCategories } from "@/lib/data";
import { CategoryIcon } from "@/components/CategoryIcon";
import { DeleteCategoryButton } from "@/components/DeleteCategoryButton";
import { NewCategoryForm } from "@/components/NewCategoryForm";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold">Categorias</h1>
        <p className="text-sm text-foreground-muted">
          As categorias base estão sempre disponíveis. Cria as tuas para casos
          específicos.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-3"
          >
            <CategoryIcon icon={category.icon} color={category.color} size={16} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {category.name}
            </span>
            {!category.isDefault && (
              <DeleteCategoryButton id={category.id} name={category.name} />
            )}
          </div>
        ))}
      </div>

      <NewCategoryForm />
    </div>
  );
}
