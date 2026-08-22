import type { RepositorioCategoria, RepositorioDespesa, RepositorioPerfil } from "@/core/ports/repositories";
import type { FornecedorGestaoIdentidade } from "@/core/ports/identity";

/** Forma do contentor de dependências — ver src/composition/container.ts. */
export type Dependencias = {
  categorias: RepositorioCategoria;
  despesas: RepositorioDespesa;
  perfis: RepositorioPerfil;
  identidade: FornecedorGestaoIdentidade;
};
