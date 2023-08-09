CREATE TABLE actions (
  "service" NOT NULL -- human-readable name of the service
  , "prefix" NOT NULL -- the service's prefix, e.g. "s3"
  , "action" NOT NULL -- the action name, e.g. "GetObject"
  , "access_level" NULL -- the access level, e.g. "Read"
  , "table_link" NOT NULL -- the link to the table from which this action was scraped
  , "action_docs_link" NULL -- a link to further documentation on the action
  , "condition_keys" NULL -- the condition keys
  , "dependent_actions" NULL -- the dependent actions, e.g. "s3:ListBucket"
);

CREATE INDEX actions_service_idx ON actions (lower(service)); -- for searching just the service
CREATE INDEX actions_prefix_idx ON actions (lower(prefix)); -- for searching just the prefix
CREATE INDEX actions_id_idx ON actions (lower(prefix), lower(action)); -- for searching prefix:Action ids
CREATE INDEX actions_service_level_idx ON actions (lower(prefix), lower(access_level)); -- for searching for all action levels in a service
