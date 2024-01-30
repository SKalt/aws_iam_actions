"use client";
import { Action } from "@/lib/types";
import { useEffect, useState } from "react";

function RelatedList({ parent, items = "" }: { parent: string; items: string }) {
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
    <tr className="action">
      <td>
        {/* TODO: make this column a sticky header */}
        <a href={action.action_docs_link} target="_blank">
          <code>
            {action.prefix}:{action?.action}
          </code>
        </a>
      </td>
      {/* TODO: also make access_level sticky */}
      <td title="access level">{action.access_level}</td>
      <td title="condition keys">
        <RelatedList parent={action.action} items={action.condition_keys} />
      </td>
      {showDependent ? (
        <td title="dependent actions">
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

export default function ActionFilter({
  actions,
  anyDependentActions,
}: {
  actions: Action[];
  anyDependentActions: boolean;
}) {
  const [filter, setFilter] = useState(""); // applies to action only
  const [filteredData, setFilteredData] = useState(actions); // applies to action only
  useEffect(() => {
    // TODO: cache filtering with useMemo
    // TODO: debounce filtering by 50ms
    // this entire `useEffect` to set the filtered results seems like a hack
    setFilteredData(
      actions.filter((action) =>
        action.action?.toLowerCase().includes(filter.toLowerCase()),
      ),
    );
  }, [filter, actions]);
  // FIXME: table overflows on small or medium screens
  return (
    <div className="flex flex-col container">
      <input
        type="text"
        placeholder="Filter actions by name"
        className="container sticky top-0 z-10"
        onChange={(e) => setFilter(e.target.value)}
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
