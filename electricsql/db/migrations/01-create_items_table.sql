CREATE TABLE recipes (
  id UUID PRIMARY KEY,
  recipeName TEXT NOT NULL,
  scale REAL NOT NULL
  -- TODO: instructions rich-text
);

ALTER TABLE recipes ENABLE ELECTRIC;

CREATE TABLE ingredients (
  id UUID PRIMARY KEY,
  -- Note: Plain LWW value, not a text CRDT (unlike other demos).
  text TEXT NOT NULL,
  amount_unscaled REAL NOT NULL,
  units TEXT NOT NULL,
  position TEXT NOT NULL,
  -- TODO: edit-wins-over-delete semantics?
  -- Sounds like automatic, but not sure.

  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

ALTER TABLE ingredients ENABLE ELECTRIC;