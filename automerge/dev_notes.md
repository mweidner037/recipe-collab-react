# Dev Notes

Questions/comments/issues that I had while creating this demo.

Context:

- I started by cloning the [automerge-repo-quickstart](https://github.com/automerge/automerge-repo-quickstart).
- I've used the core parts of Automerge and Automerge-Repo before (for CRDT benchmarks), but not made a proper app with them.

1. For reusable components that accept & mutate a part of a doc, it seems like they need to input a "path" and prefix all operations with that path - unlike the top-level component, which gets to work with the doc directly. It would be nice to have a wrapper that hides this difference: e.g., a function `prefix(doc, changeDoc, path)` that returns a scoped `[doc, changeDoc]`, or a way to embed a path in a document URL so that `useDocument` "just works".
2. When pushing down a `[doc, changeDoc]` pair, the type for `changeDoc` is a bit hard to write. (Would it be better to push down a separate handler for each event, each wrapping `changeDoc`?)
3. Elaborating on 1: This got awkward for the ingredients, since the path includes an array index that I have to pass through to the (filtered & sorted) rendered state (`pathIndex` in `ingredients.tsx`). I guess I could use a map w/ UUID key instead of an array, but this seems redundant with Automerge's own internal IDs. Would be nice if I could get the path from the object itself, like an expanded version of `getObjectId`.
   - I tricked myself here by replacing each `ingr` with `{ ...ingr, pathIndex }`, then trying to call `getConflicts` - which rightly complained that the new object was not an Automerge object. Fixed by using a wrapper `{ ingr, pathIndex }` instead of trying to combine the `pathIndex` property with `ingr`.
4. Subtle bug (my fault): I forget to wrap one call in `changeDoc` (`doc.ingredients.push(ingr);`). No type errors or call-site runtime errors, but on the next render, `getConflicts` failed when it got to that ingredient (`"must be the document root"`).
   - Seems like some ops (e.g. `A.splice`) have built-in protection here (runtime errors), but apparently not push? Or did React hijack the control flow s.t. the `getConflicts` error appears first in the console?
5. How can I convert a doc + path (like the built-in methods accept as input) into its value? Can this be done in a type-safe way? (Current attempt: see `getAtPath` in `util.ts`.)
6. Calling `setState` hook inside a changeFn seems to work (e.g. setCursor calls in `automerge_text_input.tsx`) - nice.
   - I originally tried doing the setCursor calls outside the changeFn, but the issue is that those see the old doc state. I think this is expected for React code that takes an immutable doc as a prop; I just got tricked because I was migrating from Collabs code, where the "doc" is mutable.
   - The Automerge style appeared to solve a weird edge case with onSelect in the Collabs code (`skipNextSelect` in [CollabsTextInput](https://github.com/composablesys/collabs/blob/master/react/src/components/collabs_text_input.tsx)). So I got to remove that workaround.
7. getConflicts behavior: https://github.com/automerge/automerge/issues/889 surprised me, but I can see how it makes sense as-is.
8. Moving ingredients: Instead of trying to figure out a list-with-move using Automerge's lists/cursors, I cheated by using a different library, to create the ingredient `position` values (which are then synced through Automerge as opaque strings): [position-strings](https://github.com/mweidner037/position-strings#readme).
