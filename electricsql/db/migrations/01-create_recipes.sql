CREATE TABLE recipes (
  id UUID PRIMARY KEY,
  recipeName TEXT NOT NULL,
  scale REAL NOT NULL
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

-- Rich-text tables for the instructions.

CREATE TABLE bunches (
  id TEXT PRIMARY KEY,
  -- Another bunchId or "ROOT".
  parent_id TEXT NOT NULL,
  theOffset INTEGER NOT NULL,
  -- To use in another app, replace recipes(id) with your doc IDs.
  doc_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

ALTER TABLE bunches ENABLE ELECTRIC;

-- To allow merging concurrent deletions within the same bunch,
-- we unfortunately need to store each (Position, char) pair as
-- its own row, instead of as fields within the bunch.
CREATE TABLE char_entries (
  -- String encoding of the Position, used since we need a primary key
  -- but don't want to waste space on a UUID.
  pos TEXT PRIMARY KEY,
  -- Electric does not support CHAR(1), so use TEXT instead.
  char TEXT NOT NULL,
  -- Store doc IDs so we can delete cascade.
  -- To use in another app, replace recipes(id) with your doc IDs.
  doc_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE
);

ALTER TABLE char_entries ENABLE ELECTRIC;

-- TODO: formatting