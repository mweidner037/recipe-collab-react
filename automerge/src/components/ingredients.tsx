import { useEffect, useRef, useState } from "react";

import { next as A } from "@automerge/automerge";
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
  doc: A.Doc<RecipeDoc>;
  changeDoc: (
    changeFn: A.ChangeFn<RecipeDoc>,
    options?: A.ChangeOptions<RecipeDoc> | undefined
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
  const withIndex: { ingr: IngredientType; pathIndex: number }[] =
    doc.ingredients.map((ingr, i) => ({ ingr, pathIndex: i }));
  const presentIngredients = withIndex.filter(({ ingr }) => {
    // True-wins semantics: If any conflict is true, the ingr is present.
    const conflicts = A.getConflicts(ingr, "present");
    if (!conflicts) return ingr.present;
    for (const conflict of Object.values(conflicts)) {
      if (conflict) return true;
    }
    return false;
  });
  // Sort by ingredient.position.
  const sortedIngredients = presentIngredients.sort((a, b) =>
    a.ingr.position < b.ingr.position ? -1 : 1
  );

  return (
    <>
      <div className="title">Ingredients</div>
      {sortedIngredients.map(({ ingr, pathIndex }, index) => {
        // TODO: scroll-to-ingredient if the one you're editing is moved.
        // TODO: remove this if; change {return} to ()
        if (A.getObjectId(ingr) === null) {
          throw new Error("objID is null");
        }
        return (
          <div key={A.getObjectId(ingr)} className="ingredientWrapper">
            <div style={{ display: "flex", flexDirection: "column" }}>
              <button
                style={{ alignSelf: "flex-start" }}
                disabled={index === 0}
                onClick={() => {
                  // Create a position between index-2 and index-1.
                  const newPos = positionSource.createBetween(
                    index === 1
                      ? undefined
                      : sortedIngredients[index - 2].ingr.position,
                    sortedIngredients[index - 1].ingr.position
                  );
                  changeDoc((doc) => {
                    doc.ingredients[pathIndex].position = newPos;
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
                    sortedIngredients[index + 1].ingr.position,
                    index === sortedIngredients.length - 2
                      ? undefined
                      : sortedIngredients[index + 2].ingr.position
                  );
                  changeDoc((doc) => {
                    doc.ingredients[pathIndex].position = newPos;
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
              pathIndex={pathIndex}
              textRef={ingr === newIngr ? newIngrTextRef : undefined}
            />
            <button
              onClick={() => {
                changeDoc((doc) => {
                  // Logical delete. Loses to concurrent edits (see filter() above).
                  doc.ingredients[pathIndex].present = false;
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
              sortedIngredients.at(-1)?.ingr.position
            ),
            text: "",
            amountUnscaled: 0,
            units: DEFAULT_UNIT,
          };
          changeDoc((doc) => {
            doc.ingredients.push(ingr);
          });
          // For setNewIngr, ingr just needs to be a unique new object -
          // doesn't matter whether it is the reference that Automerge actually stores.
          // I'm calling this outside changeDoc in case a sync render inside changeDoc
          // is a bad idea.
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
