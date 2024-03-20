CREATE TABLE recipes (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  scale REAL NOT NULL
);

ALTER TABLE recipes ENABLE ELECTRIC;

CREATE TABLE ingredients (
  id UUID PRIMARY KEY,
  -- TODO: Plain LWW value, not a text CRDT.
  text TEXT NOT NULL,
  amount_unscaled REAL NOT NULL,
  units TEXT NOT NULL,
  position TEXT NOT NULL
  -- TODO: edit-wins-over-delete semantics?
  -- Sounds like automatic, but not sure.

  recipe_id UUID REFERENCES(recipes.id) ON DELETE CASCADE
);

ALTER TABLE ingredients ENABLE ELECTRIC;