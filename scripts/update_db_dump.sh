#!/usr/bin/env bash
### USAGE: update_db_dump.sh
### dump data/iam_actions.sqlite3 to data/iam_actions.sql

if [[ "${BASH_SOURCE[0]}" = */* ]]; then this_dir="${BASH_SOURCE[0]%/*}"; else this_dir=.; fi
# shellcheck source=./common.sh
. "$this_dir/common.sh"
dump_relation() {
  local table_name="$1"
  echo ".dump $table_name" |
    sqlite3 "$db_path" |
    grep -v 'BEGIN TRANSACTION;' |
    grep -v 'COMMIT;'
}

main() {
  set -euo pipefail
  {
    echo "PRAGMA foreign_keys=OFF;"
    echo "BEGIN TRANSACTION;"
    # ensure no pre-existing data gets retained
    echo "DROP INDEX IF EXISTS actions_service_idx;"
    echo "DROP INDEX IF EXISTS actions_prefix_idx;"
    echo "DROP INDEX IF EXISTS actions_id_idx;"
    echo "DROP INDEX IF EXISTS actions_name_idx;"
    echo "DROP INDEX IF EXISTS prefix_idx;"
    echo "DROP INDEX IF EXISTS service_idx;"
    echo "DROP INDEX IF EXISTS access_level_idx;"
    echo "DROP INDEX IF EXISTS actions_idx;"
    echo "DROP INDEX IF EXISTS actions_by_prefix_idx;"
    echo "DROP INDEX IF EXISTS actions_by_service_idx;"
    # drop tables + views in inverse dependency order
    echo "DROP VIEW IF EXISTS actions;"
    echo "DROP TABLE IF EXISTS actions;" # just in case
    echo "DROP TABLE IF EXISTS _actions;"
    echo "DROP TABLE IF EXISTS prefixes;"
    echo "DROP TABLE IF EXISTS services;"
    echo "DROP TABLE IF EXISTS access_levels;"
    # ensure the tables are dumped in dependency order
    dump_relation access_levels
    dump_relation services
    dump_relation prefixes
    dump_relation _actions
    dump_relation actions
    grep '^CREATE INDEX' "$schema_path" # dump indexes
    echo "COMMIT;"
  } >"$db_dump_path"
  echo ".schema" | sqlite3 "$db_path" | sed '
    s/, "/\n  , "/g;
    s/TEXT, /TEXT\n  , /g;
    s/^"/  "/g;
    s/[)],/)\n  ,/g;
  ' >"$schema_path"
}

if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then
  main "$@"
fi
