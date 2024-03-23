import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { DEFAULT_UNIT, RecipeDoc } from "./schema.ts";
import { TestBrowserWebSocketClientAdapter } from "./util.ts";

import {
  DocHandle,
  Repo,
  isValidAutomergeUrl,
} from "@automerge/automerge-repo";
import { RepoContext } from "@automerge/automerge-repo-react-hooks";
import { PositionSource } from "position-strings";

const wsNetwork = new TestBrowserWebSocketClientAdapter(
  "wss://sync.automerge.org",
  1000
);
const repo = new Repo({
  network: [wsNetwork],
  // Skip storage, for easier disconnection testing.
});

// --- "Connected" checkbox for testing concurrency ---

const connected = document.getElementById("connected") as HTMLInputElement;
connected.addEventListener("click", () => {
  localStorage.setItem("connected", connected.checked + "");
  if (connected.checked) {
    console.log("Connecting");
    wsNetwork.testConnected = true;
  } else {
    console.log("Disconnecting");
    wsNetwork.testConnected = false;
  }
});

connected.checked = localStorage.getItem("connected") !== "false";
wsNetwork.testConnected = connected.checked;

// --- Setup from template ---

declare global {
  interface Window {
    handle: DocHandle<unknown>;
  }
}

const rootDocUrl = `${document.location.hash.substring(1)}`;
let handle: DocHandle<RecipeDoc>;
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
  <RepoContext.Provider value={repo}>
    <App docUrl={docUrl} docHandle={handle} />
  </RepoContext.Provider>
);
