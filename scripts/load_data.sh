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
    cat "$schema_path"
    echo ".mode tabs"
    echo ".import $tsv_path actions"
    # the right way to ignore the tsv header is to pass `--skip 1` to `.import`
    # but that isn't working on my machien for some reason
    echo "DELETE FROM actions WHERE service = 'service';" # HACK: delete the header row
  } | sqlite3 "$db_path"
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then main "$@"; fi
