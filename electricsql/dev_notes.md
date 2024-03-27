# Dev Notes

Questions/comments/issues that I had while creating this demo.

Context:

- I followed the [Electric Quickstart](https://electric-sql.com/docs/quickstart).
- I know basic SQL queries, but have barely used Postgres before.

1. Quick start shows how to do a migration that adds a new table. What about restarting the schema/DB completely? (E.g., to get rid of the starter table, or restart my own schema without "relation already exists" errors.)
   - More generally: How can I "set the schema" using raw SQL? The docs only mention migration frameworks.
2. Referential integrity: My understanding is that updates to a row with a foreign key constraint will override deleting the referenced row; however, this is not quite stated explicitly. https://electric-sql.com/docs/usage/data-modelling/constraints#referential-integrity links to two pages:
   - https://electric-sql.com/docs/intro/offline#preserving-data-integrity : Gives an example where this is true.
   - https://electric-sql.com/blog/2022/05/03/introducing-rich-crdts#compensations : States that you "can" do this using compensations, but does not explicitly say what Electric does.
3. Related to referential integrity: What happens if a row is updated and deleted concurrently?
4. https://electric-sql.com/docs/usage/data-modelling/constraints : I tried this and got `error: syntax error at or near "post_id"`. I believe it should be `post_id UUID REFERENCES posts(id) ON DELETE CASCADE`, not `post_id UUID REFERENCES(posts.id) ON DELETE CASCADE` ([docs](https://www.postgresql.org/docs/current/tutorial-fk.html)).
