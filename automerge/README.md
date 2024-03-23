# Automerge - Recipe Editor Demo

(Based on [automerge-repo-quickstart](https://github.com/automerge/automerge-repo-quickstart))

This is an example [local-first](https://www.inkandswitch.com/local-first) app using [Automerge](https://automerge.org).

Behaviors demonstrated (see [`src/schema.ts`](./src/schema.ts)):

1. Rich-text editing using Automerge's `next` string API, Quill, and a reusable [`AutomergeQuill`](./src/components/automerge_quill.tsx) component.
2. Plain-text editing using a reusable `<input type="text">` component, [`AutomergeTextInput`](./src/components/automerge_text_input.tsx).
3. Ingredients can be moved (arrows on the left). If an ingredient is moved and edited concurrently, both updates go through in the obvious way. To implement this, we assign a [position string](https://github.com/mweidner037/position-strings#readme) to each ingredient and sort by those, instead of using an Automerge array.
4. The recipe can be scaled (buttons at the bottom). If the recipe is scaled while other edits happen concurrently, the edited amounts are also scaled, keeping the recipe in proportion. To implement this, we store an `amountUnscaled` for each ingredient and a global `scale`, displaying their product (cf. [global modifiers in CRDTs](https://mattweidner.com/2023/09/26/crdt-survey-2.html#global-modifiers)).
5. If an ingredient is deleted and edited concurrently, the edit "wins" over the delete, canceling it. To implement this, we store a `present` field on each ingredient, re-set it to true each time the ingredient is edited, and display the ingredient if any of the field's [conflicts](https://automerge.org/automerge/api-docs/js/functions/getConflicts.html) are true.

## Installation

Clone the project, install its dependencies, and run `yarn dev` to start the local dev server.

```bash
$ git clone https://github.com/mweidner037/recipe-collab-react.git
# Cloning into recipe-collab-react...
$ cd recipe-collab-react/automerge
$ yarn
# Installing project dependencies...
$ yarn dev
# Starting Vite dev server...
```

Navigate to http://localhost:5173 to see the app running.

You'll notice the URL change to append a hash with an Automerge document ID, e.g.:

`http://localhost:5173/#automerge:8SEjaEBFDZr5n4HzGQ312TWfhoq`

Open the same URL (including the document ID) in another tab or another browser to see each client's changes synchronize with all other active clients.

Use the "Connected" checkbox in the top left to temporarily disconnect one client from the server, so that operations in the two tabs are concurrent.
