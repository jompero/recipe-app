// PROTOTYPE (US-3.1), throwaway. Three looks for the cookbook grid and recipe page, on the
// dev-only route #/prototype (grid) and #/prototype/:id (recipe), switchable with ?v=A|B|C.
// Real recipes from the emulator, read-only. Deleted in US-3.2.
import { useParams, useSearchParams } from "react-router";
import { BookGrid, BookRecipe } from "./VariantBook.tsx";
import { IndexGrid, IndexRecipe } from "./VariantIndex.tsx";
import { MagazineGrid, MagazineRecipe } from "./VariantMagazine.tsx";
import { Loading, PrototypeSwitcher, useRecipes } from "./protoShared.tsx";

export default function CookbookPrototype() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const variant = params.get("v") ?? "A";
  const recipes = useRecipes();

  let page;
  if (!recipes) {
    page = <Loading />;
  } else if (id) {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) page = <Loading>Recipe not found</Loading>;
    else if (variant === "B") page = <MagazineRecipe recipe={recipe} />;
    else if (variant === "C") page = <IndexRecipe recipe={recipe} />;
    else page = <BookRecipe recipe={recipe} />;
  } else if (variant === "B") {
    page = <MagazineGrid recipes={recipes} />;
  } else if (variant === "C") {
    page = <IndexGrid recipes={recipes} />;
  } else {
    page = <BookGrid recipes={recipes} />;
  }

  return (
    <>
      {page}
      <PrototypeSwitcher />
    </>
  );
}
