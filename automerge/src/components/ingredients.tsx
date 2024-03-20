import { useEffect, useRef, useState } from "react";

import {
  ChangeFn,
  ChangeOptions,
  Doc,
  getConflicts,
  getObjectId,
} from "@automerge/automerge";
import { PositionSource } from "position-strings";
import { DEFAULT_UNIT, IngredientType, RecipeDoc } from "../schema";
import { Ingredient } from "./ingredient";
import "./ingredients.css";

// Okay if this is shared globally, although in practice there is
// just one Ingredients component.
const positionSource = new PositionSource();

export function Ingredients({
  doc,
  changeDoc,
}: {
  doc: Doc<RecipeDoc>;
  changeDoc: (
    changeFn: ChangeFn<RecipeDoc>,
    options?: ChangeOptions<RecipeDoc> | undefined
  ) => void;
}) {
  // When the local user adds a new ingredient, scroll to it and
  // select its text.
  const [newIngr, setNewIngr] = useState<IngredientType | null>(null);
  const newIngrTextRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (newIngrTextRef.current === null) return;
    newIngrTextRef.current.select();
    newIngrTextRef.current.scrollIntoView();
    // Use newIngr as dependency so this only runs on the first render after adding.
  }, [newIngr]);

  // Attach each ingredient's current index so that we can track it through the
  // filter & sort below.
  // We need the index to make changes to the ingredient (part of its path in the doc).
  const withIndex: (IngredientType & { pathIndex: number })[] =
    doc.ingredients.map((ingr, i) => ({ ...ingr, pathIndex: i }));
  const presentIngredients = withIndex.filter((ingr) => {
    // True-wins semantics: If any conflict is true, the ingr is present.
    // TODO: set to true on each edit
    const conflicts = getConflicts(ingr, "present");
    if (!conflicts) return ingr.present;
    for (const conflict of Object.values(conflicts)) {
      if (conflict) return true;
    }
  });
  // Sort by ingredient.position.
  const sortedIngredients = presentIngredients.sort((a, b) =>
    a.position < b.position ? -1 : 1
  );

  return (
    <>
      <div className="title">Ingredients</div>
      {sortedIngredients.map((ingr, index) => {
        // TODO: scroll-to-ingredient if the one you're editing is moved.
        // TODO: remove this if; change {return} to ()
        if (getObjectId(ingr) === null) {
          throw new Error("objID is null");
        }
        return (
          <div key={getObjectId(ingr)} className="ingredientWrapper">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <button
                style={{ alignSelf: "flex-start" }}
                disabled={index === 0}
                onClick={() => {
                  // Create a position between index-2 and index-1.
                  const newPos = positionSource.createBetween(
                    index === 1
                      ? undefined
                      : sortedIngredients[index - 2].position,
                    sortedIngredients[index - 1].position
                  );
                  changeDoc((doc) => {
                    doc.ingredients[ingr.pathIndex].position = newPos;
                  });
                }}
              >
                ↑
              </button>
              <button
                style={{ alignSelf: "flex-start" }}
                disabled={index === sortedIngredients.length - 1}
                onClick={() => {
                  // Create a position between index+1 and index+2.
                  const newPos = positionSource.createBetween(
                    sortedIngredients[index + 1].position,
                    index === sortedIngredients.length - 2
                      ? undefined
                      : sortedIngredients[index + 2].position
                  );
                  changeDoc((doc) => {
                    doc.ingredients[ingr.pathIndex].position = newPos;
                  });
                }}
              >
                ↓
              </button>
            </div>
            <Ingredient
              ingr={ingr}
              scale={doc.scale}
              changeDoc={changeDoc}
              pathIndex={ingr.pathIndex}
              textRef={ingr === newIngr ? newIngrTextRef : undefined}
            />
            <button
              onClick={() => {
                changeDoc((doc) => {
                  // Logical delete. Loses to concurrent edits (see filter() above).
                  doc.ingredients[ingr.pathIndex].present = false;
                });
              }}
              className="deleteButton"
            >
              X
            </button>
          </div>
        );
      })}
      <button
        onClick={() => {
          const ingr = {
            present: true,
            position: positionSource.createBetween(
              sortedIngredients.at(-1)?.position
            ),
            text: "",
            amountUnscaled: 0,
            units: DEFAULT_UNIT,
          };
          doc.ingredients.push(ingr);
          setNewIngr(ingr);
        }}
        className="addButton"
      >
        +
      </button>
      <br />
      <button
        onClick={() => {
          changeDoc((doc) => (doc.scale *= 2.0));
        }}
        className="scaleButton"
      >
        Double the recipe!
      </button>
      &nbsp;&nbsp;
      <button
        onClick={() => {
          changeDoc((doc) => (doc.scale *= 0.5));
        }}
        className="scaleButton"
      >
        Halve the recipe!
      </button>
    </>
  );
}
