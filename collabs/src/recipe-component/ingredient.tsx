import { CObject, CText, CVar, InitToken, IVar } from "@collabs/collabs";
import {
  CollabsTextInput,
  CollabsTextInputHandle,
  useCollab,
} from "@collabs/react";
import React, { Ref, useEffect, useRef, useState } from "react";
import { CScaleNum } from "./c_scale_num";

import "./ingredient.css";

type Unit = "kg" | "g" | "mg" | "L" | "mL" | "ct";
const AllUnits: Unit[] = ["kg", "g", "mg", "L", "mL", "ct"];
const defaultUnit: Unit = "g";

export class CIngredient extends CObject {
  readonly text: CText;
  readonly amount: CScaleNum;
  readonly units: CVar<Unit>;

  constructor(init: InitToken, scaleVar: IVar<number>) {
    super(init);

    this.text = super.registerCollab("text", (textInit) => new CText(textInit));
    this.amount = super.registerCollab(
      "amount",
      (amountInit) => new CScaleNum(amountInit, scaleVar)
    );
    this.units = super.registerCollab(
      "units",
      (unitsInit) => new CVar(unitsInit, defaultUnit)
    );
  }
}

export function Ingredient({
  ingr,
  textRef,
  onChange,
}: {
  ingr: CIngredient;
  textRef?: Ref<CollabsTextInputHandle>;
  /**
   * Called each time the local user changes the ingredient
   * (including for "prep" edits that don't yet change the Collabs state).
   */
  onChange?: () => void;
}) {
  // CIngredient does not emit its own events, only its children do.
  // So we must listen on the children that we render here instead of in
  // their own components.
  useCollab(ingr.amount);
  useCollab(ingr.units);

  const [amountEditing, setAmountEditing] = useState<string | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  function setAmount(inputStr: string) {
    const parsed = Number.parseFloat(inputStr);
    if (!isNaN(parsed) && 0 <= parsed) {
      ingr.amount.value = parsed;
    }
  }

  useEffect(() => {
    if (onChange) {
      return ingr.text.on("Any", (e) => {
        if (e.meta.isLocalOp) onChange();
      });
    }
  }, [ingr.text, onChange]);

  return (
    <div className="ingredient">
      <CollabsTextInput text={ingr.text} ref={textRef} size={12} />
      <input
        type="number"
        min={0}
        // Although the GUI step is 1, we allow you to type decimals.
        // These are rounded to .00 in the display, although you can enter
        // (or scale) more precise values.
        step={1}
        value={amountEditing ?? Math.round(ingr.amount.value * 100) / 100}
        onChange={(e) => {
          // If the element is in focus (being typed in), wait until we lose
          // focus to change the value (onBlur).
          // Otherwise (changed using up/down arrows), change the value immediately.
          if (document.activeElement === amountRef.current) {
            setAmountEditing(e.target.value);
          } else setAmount(e.target.value);
          if (onChange) onChange();
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
        value={ingr.units.value}
        onChange={(e) => {
          ingr.units.value = e.target.value as Unit;
          if (onChange) onChange();
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
