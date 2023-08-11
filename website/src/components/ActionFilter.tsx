"use client";
import { Action } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

function ActionFilterItem({ action }: { action: Action }) {
  return (
    <tr>
      <td>
        <a href={action.action_docs_link} target="_blank">
          <code>
            {action.prefix}:{action.action}
          </code>
        </a>
      </td>
      <td>
        <span title="access level">{action.access_level}</span>
      </td>
      <td>
        <span title="condition keys">{action.condition_keys}</span>
      </td>
      <td>
        <span title="dependent actions">
          {action.dependent_actions.split(", ").map((id) => (
            <Link key={`link-${id}`} href={`/action/${id}`}></Link>
          ))}
        </span>
      </td>
      <td>
        <a href={action.table_link} target="_blank">
          source
        </a>
      </td>
    </tr>
  );
}

// TODO: make the header sticky

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
    setFilteredData(
      actions.filter((action) =>
        action.action.toLowerCase().includes(filter.toLowerCase()),
      ),
    );
  }, [filter, actions]);
  return (
    <div className="flex flex-col container">
      <input
        type="text"
        className="container sticky top-0"
        onChange={(e) => setFilter(e.target.value)}
      ></input>
      <table>
        <thead>
          <tr>
            <th>action</th>
            <th>access level</th>
            <th>condition keys</th>
            <th>dependent actions</th>
            <th>source</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((action) => (
            <ActionFilterItem
              key={`${action.prefix}:${action.action}`}
              action={action}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
