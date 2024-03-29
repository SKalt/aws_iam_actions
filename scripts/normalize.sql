CREATE TABLE prefixes(
  id INTEGER PRIMARY KEY
  , name TEXT NOT NULL
);
INSERT INTO prefixes (name) SELECT DISTINCT prefix FROM _actions ORDER BY prefix;

CREATE TABLE services(
  id INTEGER PRIMARY KEY
  , name TEXT NOT NULL
);
INSERT INTO services (name) SELECT DISTINCT service FROM _actions ORDER BY service;

CREATE TABLE access_levels (
  id INTEGER PRIMARY KEY
  , name TEXT NOT NULL
);
INSERT INTO access_levels (id, name) VALUES
    (1, "") -- unknown
  , (2, "Read")
  , (3, "List")
  , (4, "Tagging")
  , (5, "Write")
  , (6, "Permissions management");

ALTER TABLE _actions ADD COLUMN prefix_id INTEGER REFERENCES prefixes(id);
UPDATE _actions SET prefix_id = (SELECT id FROM prefixes AS prefix WHERE prefix.name = _actions.prefix);

ALTER TABLE _actions ADD COLUMN service_id INTEGER REFERENCES services(id);
UPDATE _actions SET service_id = (SELECT id FROM services AS service WHERE service.name = _actions.service);

ALTER TABLE _actions ADD COLUMN access_level_id INTEGER REFERENCES access_levels(id);
UPDATE _actions SET access_level_id = (SELECT id FROM access_levels AS access_level WHERE access_level.name = _actions.access_level);

UPDATE _actions SET table_link = substr(table_link, length('https://docs.aws.amazon.com/service-authorization/latest/reference/') + 1);
UPDATE _actions SET action_docs_link = substr(action_docs_link, length('https://docs.aws.amazon.com/') + 1);
-- https://docs.aws.amazon.com/service-authorization/latest/reference/
-- https://docs.aws.amazon.com/

ALTER TABLE _actions DROP COLUMN access_level;
ALTER TABLE _actions DROP COLUMN prefix;
ALTER TABLE _actions DROP COLUMN service;


CREATE INDEX prefix_idx ON prefixes (lower(name));
CREATE INDEX service_idx ON services (lower(name));
CREATE INDEX access_level_idx ON access_levels (lower(name));
CREATE INDEX actions_idx ON _actions (lower(action));
CREATE INDEX actions_by_prefix_idx ON _actions (prefix_id);
CREATE INDEX actions_by_service_idx ON _actions (service_id);

CREATE VIEW actions
 AS
  SELECT
    service.name AS service
    , prefix.name AS prefix
    , _actions.action AS action
    , access_level.name AS access_level
    , _actions.condition_keys
    , _actions.dependent_actions
    , 'https://docs.aws.amazon.com/service-authorization/latest/reference/' || _actions.table_link AS table_link
    , 'https://docs.aws.amazon.com/' || _actions.action_docs_link AS action_docs_link
FROM _actions
INNER JOIN services AS service ON service.id = _actions.service_id
INNER JOIN prefixes AS prefix ON prefix.id = _actions.prefix_id
FULL OUTER JOIN access_levels AS access_level ON access_level.id = _actions.access_level_id;

-- (
--   service             TEXT NOT NULL -- human-readable name of the service
--   , prefix            TEXT NOT NULL -- IAM service prefix
--   , action            TEXT NOT NULL -- the action name, e.g. "GetObject"
--   , access_level      TEXT NULL     -- the access level, e.g. "Read"
--   , condition_keys    TEXT NULL
--   , dependent_actions TEXT NULL      -- in the form of "s3:ListBucket"
--   , table_link        TEXT NULL      -- the link to the table from which this action was scraped
--   , action_docs_link  TEXT NULL      -- a link to further documentation on the action
-- )

VACUUM;
