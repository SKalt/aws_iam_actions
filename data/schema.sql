CREATE TABLE IF NOT EXISTS "_actions"(
  "action" TEXT
  , "table_link" TEXT
  , "action_docs_link" TEXT
  , "condition_keys" TEXT
  , "dependent_actions" TEXT
  , prefix_id INTEGER REFERENCES prefixes(id)
  , service_id INTEGER REFERENCES services(id)
  , access_level_id INTEGER REFERENCES access_levels(id));
CREATE TABLE prefixes(
  id INTEGER PRIMARY KEY
  , name TEXT NOT NULL
);
CREATE TABLE services(
  id INTEGER PRIMARY KEY
  , name TEXT NOT NULL
);
CREATE TABLE access_levels (
  id INTEGER PRIMARY KEY
  , name TEXT NOT NULL
);
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
FULL OUTER JOIN access_levels AS access_level ON access_level.id = _actions.access_level_id
/* actions(service,prefix,"action",access_level,condition_keys,dependent_actions,table_link,action_docs_link) */;
