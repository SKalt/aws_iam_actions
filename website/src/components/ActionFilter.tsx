"use client";
import { AccessLevelName, Action } from "@/lib/types";
import Link from "next/link";
import { useEffect, useState } from "react";

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
        <a href={action.action_docs_link} target="_blank">
          <code>
            {action.prefix}:{action.action}
          </code>
        </a>
      </td>
      <td title="access level">{action.access_level}</td>
      <td title="condition keys">{action.condition_keys}</td>
      {showDependent ? (
        <td>
          <span title="dependent actions">
            {action.dependent_actions
              .split(", ")
              .map((m) => m.trim())
              .filter(Boolean)
              .map((id) => (
                <li>
                  <Link key={`link-${id}`} href={`/action/${id}`}>
                    {id}
                  </Link>
                </li>
              ))}
          </span>
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

const levels = [
  AccessLevelName.Unknown,
  AccessLevelName.Read,
  AccessLevelName.List,
  AccessLevelName.Write,
  AccessLevelName.Tagging,
  AccessLevelName.Permissions,
]; // not by avicii in this one instance
function AccessLevelSelector() {
  return (
    <select>
      {levels.map((level) => (
        <option>{level}</option>
      ))}
    </select>
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
