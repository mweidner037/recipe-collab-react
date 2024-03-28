import { useLiveQuery } from "electric-sql/react";
import { genUUID } from "electric-sql/util";
import { PositionSource } from "position-strings";
import { useState } from "react";

import { useElectric } from "../Loader";
import { Recipes as Recipe } from "../generated/client";
import { DEFAULT_UNIT } from "../units";
import { RecipeEditor } from "./RecipeEditor";

import logo from "../assets/logo.svg";
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
    // Add a starting ingredient.
    await db.ingredients.create({
      data: {
        id: genUUID(),
        text: "",
        amount_unscaled: 0,
        units: DEFAULT_UNIT,
        // Arbitrary valid starting position.
        position: new PositionSource({ ID: "INIT" }).createBetween(),
        recipe_id: id,
      },
    });
  };

  const recipes: Recipe[] = results ?? [];

  return (
    <div className="Picker">
      <header className="Picker-header">
        <img src={logo} className="Picker-logo" alt="logo" />
        <div>
          <div className="controls">
            <button className="button" onClick={addRecipe}>
              Add
            </button>
          </div>
          {recipes.map((recipe) => (
            <p
              key={recipe.id}
              className="recipe"
              onClick={() => onPick(recipe.id)}
            >
              <code>{recipe.recipename}</code>
            </p>
          ))}
        </div>
      </header>
    </div>
  );
}
