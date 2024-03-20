import { AutomergeUrl } from "@automerge/automerge-repo";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import "./App.css";
import { Ingredients } from "./components/ingredients";
import { RecipeName } from "./components/recipe_name";
import { RecipeDoc } from "./schema";

function App({ docUrl }: { docUrl: AutomergeUrl }) {
  const [doc, changeDoc] = useDocument<RecipeDoc>(docUrl);

  if (!doc) {
    return <>Loading...</>;
  }

  return (
    <div className="outerDiv">
      <RecipeName
        recipeName={doc.recipeName}
        onSet={(newRecipeName) => {
          changeDoc((doc) => {
            doc.recipeName = newRecipeName;
          });
        }}
      />
      <div className="splitViewport">
        <div className="split left">
          <div className="centered">
            <Ingredients doc={doc} changeDoc={changeDoc} />
          </div>
        </div>
        {/* <div className="split right">
          <div className="instructions">
            <div className="title">Instructions</div>
            <AutomergeQuill
              doc={doc}
              changeDoc={changeDoc}
              path={["instructions"]}
            />
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default App;
