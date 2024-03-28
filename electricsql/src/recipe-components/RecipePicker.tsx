import { useLiveQuery } from "electric-sql/react";
import { genUUID } from "electric-sql/util";

import { Recipes as Recipe } from "../generated/client";
import { useElectric } from "../Loader";

import { useState } from "react";
import { RecipeEditor } from "./RecipeEditor";
import "./RecipePicker.css";

export function RecipePicker() {
  const [pickedId, setPickedId] = useState<string>();

  if (pickedId) {
    return <RecipeEditor recipeId={pickedId} />;
  } else {
    return <NotYetPicked onPick={setPickedId} />;
  }
}

function NotYetPicked({ onPick }: { onPick: (recipeId: string) => void }) {
  const { db } = useElectric()!;

  const { results } = useLiveQuery(
    db.recipes.liveMany({ orderBy: { recipename: "asc" } })
  );

  const addRecipe = async () => {
    const id = genUUID();
    await db.recipes.create({
      data: {
        id,
        recipename: `Untitled ${id.slice(0, 6)}`,
        scale: 1,
      },
    });
  };

  const recipes: Recipe[] = results ?? [];

  return (
    <div>
      <div className="controls">
        <button className="button" onClick={addRecipe}>
          Add
        </button>
      </div>
      {recipes.map((recipe) => (
        <p key={recipe.id} className="recipe" onClick={() => onPick(recipe.id)}>
          <code>{recipe.recipename}</code>
        </p>
      ))}
    </div>
  );
}
