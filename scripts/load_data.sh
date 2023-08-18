#!/usr/bin/env bash
### USAGE: load_data.sh
### refresh data/iam_actions.sqlite3 from data/iam_actions.tsv

if [[ "${BASH_SOURCE[0]}" = */* ]]; then this_dir="${BASH_SOURCE[0]%/*}"; else this_dir=.; fi
# shellcheck source=./common.sh
. "$this_dir/common.sh"

main() {
  set -euo pipefail
  rm -f "$db_path"
  {
    # cat "$schema_path"
    echo ".mode tabs"
    echo ".import $tsv_path _actions"
    cat "$this_dir/normalize.sql"
  } | sqlite3 "$db_path"
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then main "$@"; fi
