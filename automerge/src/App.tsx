import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import "./App.css";
import automergeLogo from "/automerge.png";

type Unit = "kg" | "g" | "mg" | "L" | "mL" | "ct";
const AllUnits: Unit[] = ["kg", "g", "mg", "L", "mL", "ct"];
export const defaultUnit: Unit = "g";

export interface Ingredient {
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
   * LWW semantics.
   * TODO: change to text CRDT semantics?
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
  ingredients: Ingredient[];
  /**
   * Rich-text semantics.
   */
  instructions: string;
}

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const [doc, changeDoc] = useDocument<RecipeDoc>(docUrl);

  return (
    <>
      <div>
        <a href="https://automerge.org" target="_blank">
          <img src={automergeLogo} className="logo" alt="Vite logo" />
        </a>
      </div>
      <h1>Meet Automerge</h1>
      <div className="card">
        <button onClick={() => changeDoc((d) => d.counter.increment(1))}>
          count is {doc && doc.counter.value}
        </button>
        <p>Open this page in another tab to watch the updates synchronize</p>
      </div>
      <p className="read-the-docs">
        Built with Automerge, Vite, React, and TypeScript
      </p>
    </>
  );
}

export default App;
