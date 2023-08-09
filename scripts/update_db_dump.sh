#!/usr/bin/env bash
### USAGE: update_db_dump.sh
### dump data/iam_actions.sqlite3 to data/iam_actions.sql

if [[ "${BASH_SOURCE[0]}" = */* ]]; then this_dir="${BASH_SOURCE[0]%/*}"; else this_dir=.; fi
# shellcheck source=./common.sh
. "$this_dir/common.sh"

main() {
  set -euo pipefail
  {
    # ensure no pre-existing data gets retained
    echo "DROP INDEX IF EXISTS actions_service_idx;"
    echo "DROP INDEX IF EXISTS actions_prefix_idx;"
    echo "DROP INDEX IF EXISTS actions_id_idx;"
    echo "DROP TABLE IF EXISTS actions;"
    echo ".dump" | sqlite3 "$db_path" | grep -v 'PRAGMA'
  } > "$db_dump_path"
}

if [[ "${BASH_SOURCE[0]}" = "$0" ]]; then
  main "$@"
fi
