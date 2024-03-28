import { useLiveQuery } from "electric-sql/react";
import { genUUID } from "electric-sql/util";

import { Recipes as Recipe } from "../generated/client";
import { useElectric } from "../Loader";

import "./RecipePicker.css";

export function RecipePicker() {
  const { db } = useElectric()!;

  const { results } = useLiveQuery(
    db.recipes.liveMany({ orderBy: { recipename: "asc" } })
  );

  const addRecipe = async () => {
    await db.recipes.create({
      data: {
        id: genUUID(),
        recipename: "Untitled",
        scale: 1,
      },
    });
  };

  const clearRecipes = async () => {
    await db.recipes.deleteMany();
  };

  const recipes: Recipe[] = results ?? [];

  return (
    <div>
      <div className="controls">
        <button className="button" onClick={addRecipe}>
          Add
        </button>
        <button className="button" onClick={clearRecipes}>
          Clear
        </button>
      </div>
      {recipes.map((recipe) => (
        <p key={recipe.id} className="recipe">
          <code>{recipe.recipename}</code>
        </p>
      ))}
    </div>
  );
}
