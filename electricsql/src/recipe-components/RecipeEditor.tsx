import { useLiveQuery } from "electric-sql/react";
import { useElectric } from "../Loader";

import "./RecipeEditor.css";
import { RecipeName } from "./RecipeName";

export function RecipeEditor({ recipeId }: { recipeId: string }) {
  const { db } = useElectric()!;

  const { results } = useLiveQuery(
    db.recipes.liveUnique({ where: { id: recipeId } })
  );

  if (!results) {
    return <>Loading...</>;
  }

  return (
    <div className="outerDiv">
      <RecipeName
        recipeName={results.recipename}
        onSet={(newRecipeName) => {
          void db.recipes.update({
            where: { id: recipeId },
            data: { recipename: newRecipeName },
          });
        }}
      />
      <div className="splitViewport">
        <div className="split left">
          <div className="centered">
            TODO
            {/* <Ingredients doc={doc} changeDoc={changeDoc} /> */}
          </div>
        </div>
        {
          <div className="split right">
            <div className="instructions">
              <div className="title">Instructions</div>
              TODO
              {/* <AutomergeQuill docHandle={docHandle} path={["instructions"]} /> */}
            </div>
          </div>
        }
      </div>
    </div>
  );
}
