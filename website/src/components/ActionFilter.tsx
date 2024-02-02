"use client";
import { Action } from "@/lib/types";
import { debounce } from "@/lib/debounce";
import { useCallback, useState } from "react";
import styles from "./ActionFilter.module.css";

function RelatedList({
  parent,
  items = "",
}: {
  parent: string;
  items: string;
}) {
  const _items = [
    ...new Set(
      items
        .split(", ")
        .map((m) => m.trim())
        .filter(Boolean),
    ),
  ].sort();
  return (
    <ul>
      {_items.map((id) => (
        <li key={parent + "-l-" + id}>{id}</li>
      ))}
    </ul>
  );
}

function ActionFilterItem({
  action,
  showDependent,
}: {
  action: Action;
  showDependent?: boolean;
}) {
  return (
    <tr className={styles["action"]}>
      <td>
        {/* TODO: make this column a sticky header */}
        <a href={action.action_docs_link} target="_blank">
          <code>
            {action.prefix}:<wbr />
            {action.action}
          </code>
        </a>
      </td>
      {/* TODO: also make access_level sticky */}
      <td title="access level">{action.access_level}</td>
      <td title="condition keys" className="font-mono">
        <RelatedList parent={action.action} items={action.condition_keys} />
      </td>
      {showDependent ? (
        <td title="dependent actions" className="font-mono">
          <RelatedList
            parent={action.action}
            items={action.dependent_actions}
          />
        </td>
      ) : null}
      <td>
        <a href={action.table_link} target="_blank">
          source
        </a>
      </td>
    </tr>
  );
}

export const fuzzyFilter = (
  original: string[],
  filter: string,
  limit: number,
) => {
  let result: Set<number> = new Set();

  for (let i = 0; i < original.length; i++) {
    if (original[i].startsWith(filter)) {
      result.add(i);
      if (result.size === limit) {
        break;
      }
    }
  }
  if (result.size < limit) {
    for (let i = 0; i < original.length; i++) {
      if (result.has(i)) continue;
      if (original[i].includes(filter)) {
        result.add(i);
        if (result.size === limit) {
          break;
        }
      }
    }
  }
  return Array.from(result);
};
export default function ActionFilter({
  actions,
  anyDependentActions,
  limit,
}: {
  actions: Action[];
  anyDependentActions: boolean;
  limit: number;
}) {
  const _limit = limit || actions.length;
  const lowerActions = actions.map((a) => a.action.toLowerCase());
  const [filteredData, setFilteredData] = useState(actions); // applies to action only

  const filterData = useCallback(
    // TODO: cache filtering with useMemo?
    debounce((filter: string) => {
      setFilteredData(
        fuzzyFilter(lowerActions, filter, _limit).map((i) => actions[i]),
      );
    }, 50),
    [actions],
  );
  // FIXME: table overflows on small or medium screens
  return (
    <div className="flex flex-col container">
      <input
        type="text"
        placeholder="Filter actions by name"
        className="container sticky top-0 z-10"
        onChange={(e) => filterData(e.target.value.toLowerCase())}
      ></input>
      <table>
        {/* top-8 is 2rem, which seems to be the hight+padding of the input */}
        <thead
          className="sticky top-8 z-0"
          style={{ background: "var(--accent-color)" }}
        >
          <tr>
            <th>action</th>
            <th>access level</th>
            <th>condition keys</th>
            {anyDependentActions ? <th>dependent actions</th> : null}
            <th>source</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((action) => (
            <ActionFilterItem
              key={`${action.prefix}:${action.action}`}
              action={action}
              showDependent={anyDependentActions}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
