import { useLiveQuery } from "electric-sql/react";
import { useElectric } from "../Loader";

export function RecipeEditor({ recipeId }: { recipeId: string }) {
  const { db } = useElectric()!;

  const { results } = useLiveQuery(
    db.recipes.liveUnique({ where: { id: recipeId } })
  );

  if (!results) return null;

  return <div>{results.recipename}</div>;
}
