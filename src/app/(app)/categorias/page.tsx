import { getCategories } from "@/lib/data";
import { CategoryTile } from "@/components/CategoryTile";
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
          <CategoryTile key={category.id} category={category} />
        ))}
      </div>

      <NewCategoryForm />
    </div>
  );
}
