#!/usr/bin/env bash
if [[ "${BASH_SOURCE[0]}" = */* ]]; then this_dir="${BASH_SOURCE[0]%/*}"; else this_dir=.; fi
repo_root="$this_dir/.."
repo_root="$(cd "$repo_root" && pwd)"


export data_dir="${repo_root}/data"
export schema_path="${data_dir}/schema.sql"
export tsv_path="${data_dir}/iam_actions.tsv"
export db_path="${data_dir}/iam_actions.sqlite3"
export db_dump_path="${data_dir}/iam_actions.sql"
