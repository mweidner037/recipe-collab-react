import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { DEFAULT_UNIT, RecipeDoc } from "./schema.ts";

import {
  DocHandle,
  Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { BrowserWebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { PositionSource } from "position-strings";

const repo = new Repo({
  network: [new BrowserWebSocketClientAdapter("wss://sync.automerge.org")],
  storage: new IndexedDBStorageAdapter(),
});

declare global {
  interface Window {
    handle: DocHandle<unknown>;
  }
}

const rootDocUrl = `${document.location.hash.substring(1)}`;
let handle;
if (isValidAutomergeUrl(rootDocUrl)) {
  handle = repo.find(rootDocUrl);
} else {
  handle = repo.create<RecipeDoc>({
    recipeName: "Untitled",
    scale: 1,
    ingredients: [
      // Start with an empty ingredient, for convenience.
      {
        present: true,
        // Arbitrary valid starting position.
        position: new PositionSource({ ID: "INIT" }).createBetween(),
        text: "",
        amountUnscaled: 0,
        units: DEFAULT_UNIT,
      },
    ],
    // Need a starting "\n" to match Quill's starting state.
    instructions: "\n",
  });
}
const docUrl = (document.location.hash = handle.url);
window.handle = handle; // we'll use this later for experimentation

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RepoContext.Provider value={repo}>
      <App docUrl={docUrl} />
    </RepoContext.Provider>
  </React.StrictMode>
);
