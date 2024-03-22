export type Unit = "kg" | "g" | "mg" | "L" | "mL" | "ct";
export const AllUnits: Unit[] = ["kg", "g", "mg", "L", "mL", "ct"];
export const DEFAULT_UNIT: Unit = "g";

export interface IngredientType {
  /**
   * To make edits win over concurrent deletes, we set this to true each
   * time the ingredient is edited, and treat it as true if any of
   * the multi-values are true (ignoring the default LWW value).
   */
  present: boolean;
  /**
   * Hack: To avoid figuring out an Automerge list-with-move, we just
   * assign each ingredient a position from the position-strings library
   * and sort by those (lexicographically).
   */
  position: string;
  /**
   * Text CRDT semantics?
   */
  text: string;
  amountUnscaled: number;
  units: Unit;
}

export interface RecipeDoc {
  /**
   * LWW semantics.
   */
  recipeName: string;
  scale: number;
  /**
   * Array order is ignored - use ingr.position instead.
   *
   * Also, set ingr.present to false instead of deleting.
   */
  ingredients: IngredientType[];
  /**
   * Rich-text semantics.
   */
  instructions: string;
}
