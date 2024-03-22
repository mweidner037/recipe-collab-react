import { Ref, useRef, useState } from "react";

import { ChangeFn, ChangeOptions } from "@automerge/automerge";
import { AllUnits, IngredientType, RecipeDoc, Unit } from "../schema";
import {
  AutomergeTextInput,
  AutomergeTextInputHandle,
} from "./automerge_text_input";
import "./ingredient.css";

export function Ingredient({
  ingr,
  scale,
  doc,
  changeDoc,
  pathIndex,
  textRef,
}: {
  ingr: IngredientType;
  scale: number;
  doc: RecipeDoc;
  changeDoc: (
    changeFn: ChangeFn<RecipeDoc>,
    options?: ChangeOptions<RecipeDoc> | undefined
  ) => void;
  pathIndex: number;
  textRef?: Ref<AutomergeTextInputHandle>;
}) {
  const [amountEditing, setAmountEditing] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  const amount = ingr.amountUnscaled * scale;

  function setAmount(inputStr: string) {
    const parsed = Number.parseFloat(inputStr);
    if (!isNaN(parsed) && 0 <= parsed) {
      changeDoc((doc) => {
        // Set the value s.t. (amountUnscaled) * (global scale) = parsed.
        doc.ingredients[pathIndex].amountUnscaled = parsed / doc.scale;
        // Keep alive in the face of concurrent deletions.
        // Toggle back and forth to workaround https://github.com/automerge/automerge/issues/889
        doc.ingredients[pathIndex].present = false;
        doc.ingredients[pathIndex].present = true;
      });
    }
  }

  return (
    <div className="ingredient">
      <AutomergeTextInput
        doc={doc}
        changeDoc={(changeFn: ChangeFn<RecipeDoc>, options) => {
          function wrappedChangeFn(doc: RecipeDoc) {
            changeFn(doc);
            // Keep alive in the face of concurrent deletions.
            doc.ingredients[pathIndex].present = false;
            doc.ingredients[pathIndex].present = true;
          }
          changeDoc(wrappedChangeFn, options);
        }}
        path={["ingredients", pathIndex, "text"]}
        ref={textRef}
        size={12}
      />
      <input
        type="number"
        min={0}
        // Although the GUI step is 1, we allow you to type decimals.
        // These are rounded to .00 in the display, although you can enter
        // (or scale) more precise values.
        step={1}
        value={amountEditing ?? Math.round(amount * 100) / 100}
        onChange={(e) => {
          // If the element is in focus (being typed in), wait until we lose
          // focus to change the value (onBlur).
          // Otherwise (changed using up/down arrows), change the value immediately.
          // TODO: up/down arrows immediately: only works in Firefox, not Chrome.
          if (document.activeElement === amountRef.current) {
            setAmountEditing(e.target.value);
          } else setAmount(e.target.value);
        }}
        onBlur={() => {
          if (amountEditing === null) return;
          setAmount(amountEditing);
          setAmountEditing(null);
        }}
        style={{ width: "5ch" }}
        ref={amountRef}
        // Hide "invalid" tooltip.
        title=""
      />
      <select
        value={ingr.units}
        onChange={(e) => {
          changeDoc((doc) => {
            doc.ingredients[pathIndex].units = e.target.value as Unit;
            // Keep alive in the face of concurrent deletions.
            doc.ingredients[pathIndex].present = false;
            doc.ingredients[pathIndex].present = true;
          });
        }}
      >
        {AllUnits.map((unit) => (
          <option value={unit} key={unit}>
            {unit}
          </option>
        ))}
      </select>
    </div>
  );
}
