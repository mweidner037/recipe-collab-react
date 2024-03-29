# Dev Notes

Questions/comments/issues that I had while creating this demo.

Context:

- I followed the [Electric Quickstart](https://electric-sql.com/docs/quickstart).
- I know basic SQL queries, but have barely used Postgres before.

1. Quick start shows how to do a migration that adds a new table. What about restarting the schema/DB completely? (E.g., to get rid of the starter table, or restart my own schema without "relation already exists" errors.)
   - With help from Discord: Just needed to run the provided down and up commands, which recreate the DB container.
2. Referential integrity: My understanding is that updates to a row with a foreign key constraint will override deleting the referenced row; however, this is not quite stated explicitly. https://electric-sql.com/docs/usage/data-modelling/constraints#referential-integrity links to two pages:
   - https://electric-sql.com/docs/intro/offline#preserving-data-integrity : Gives an example where this is true.
   - https://electric-sql.com/blog/2022/05/03/introducing-rich-crdts#compensations : States that you "can" do this using compensations, but does not explicitly say what Electric does.
3. Related to referential integrity: What happens if a row is updated and deleted concurrently?
4. https://electric-sql.com/docs/usage/data-modelling/constraints : I tried this and got `error: syntax error at or near "post_id"`. I believe it should be `post_id UUID REFERENCES posts(id) ON DELETE CASCADE`, not `post_id UUID REFERENCES(posts.id) ON DELETE CASCADE` ([docs](https://www.postgresql.org/docs/current/tutorial-fk.html)).
   - I know these syntax errors are probably coming from an external tool, but they are rather unhelpful (they tell you the line with the error but no info about what the error is). E.g., I tried to name a column "offset", not knowing that it was a keyword, and the tool gave no hint of what was wrong.
5. It took me some tries to access `useElectric` from an interior component:
   - In the Quick Start starter code, the only interior component is in the same file as the component that sets up the context (`Example.tsx`). So the code just calls `makeElectricContext` once and uses the output for both components. I wanted to move `ExampleComponent` to its own file (`RecipePicker.tsx`) and so needed to find a different way.
   - I first tried repeating the `makeElectricContext` call in that file, since the docs made it sound like it a was TypeScript-generic-wrapper around a constant. However, then `useElectric()` in that file had value `null`.
   - Next, I looked at the [React docs](https://electric-sql.com/docs/integrations/frontend/react). They show the inner component do `import { useElectric } from './wrapper'`, where `wrapper.tsx` is analogous to the Quick Start's `Example` component. The `wrapper.tsx` file shown doesn't export `useElectric`, though that's easy to fix. However, combining this import with my code so far (starter code split into separate files) leads to a circular dependency: `Example.tsx` depends on `ExampleComponent`, and `ExampleComponent` depends on `useElectric` from `Example.tsx`. This works but seems like bad practice.
     - Also, the provided ESLint config does not like exporting `useElectric` from `wrapper.tsx` (rule "eslint(react-refresh/only-export-components)").
   - I guess the best practice would be to copy `ElectricWrapper` from [the docs](https://electric-sql.com/docs/integrations/frontend/react) (plus the line `export { useElectric }`) and pass in your interior components as children from a separate file, to avoid the circular dependency? I changed to use this style (see `Loader.tsx`).
6. The starter `Example.tsx` has `import { Electric, Items as Item, schema } from './generated/client'`. The `Items as Item` thing is a bit awkward, although I understand where it's coming from (name of table -> type name, but table names are traditionally plural).
7. The starter's list of items uses the index in the `items` array as a React key. It seems like it would be a better practice to use DB primary keys as React keys in general (which is what I've done).
8. Being able to ORDER BY in queries is nice (e.g., order by positions in `IngredientsEditor.tsx`). Likewise the fact that I get an ID on each result object that I can reference in mutations and React keys - this is something that CRDT libraries often hide internally.
9. I appreciate that each mutation on https://electric-sql.com/docs/api/clients/typescript comes with an example, to show how the args are formatted.
