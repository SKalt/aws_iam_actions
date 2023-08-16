"use client";

import { AccessLevelName, Action } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import ActionFilter from "./ActionFilter";

const levels = [
  // see also:
  AccessLevelName.Unknown,
  AccessLevelName.Read,
  AccessLevelName.List,
  AccessLevelName.Write,
  AccessLevelName.Tagging,
  AccessLevelName.Permissions,
];
const defaultLevels = () =>
  levels.reduce(
    (a, r) => {
      a[r] = true;
      return a;
    },
    {} as Record<AccessLevelName, boolean>,
  );

function MultiSelect({
  legend,
  options,
  placeholder,
  id,
  values,
  setValues,
}: {
  legend: string;
  id: string;
  placeholder: string;
  options: string[];
  values: string[];
  setValues: (values: string[]) => void;
}) {
  const ref = useRef(null);
  const [search, setSearch] = useState("");
  const _options = options
    .filter((v) => !values.includes(v))
    .filter((v) => v.toLowerCase().startsWith(search.toLowerCase()))
    .slice(0, 5);
  const select = (opt: string) => {
    setValues([...values, opt]);
    setSearch("");
    if (ref.current) (ref.current as HTMLInputElement).focus();
  };

  return (
    <>
      <fieldset>
        <label className="container">
          {legend}
          <input
            ref={ref}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder={placeholder}
          ></input>
        </label>
        <ul className="mx-auto">
          {_options.map((opt) => (
            <li
              key={id + `-` + opt}
              className="cursor-pointer"
              onClick={() => select(opt)}
            >
              {opt}
            </li>
          ))}
        </ul>
        <output>
          {values.map((value) => (
            <span
              className="cursor-pointer chip reset-chip"
              onClick={() => setValues(values.filter((v) => v !== value))}
              key={id + `-reset-` + value}
            >
              {value}
            </span>
          ))}
        </output>
        <datalist id={id}>
          {options
            .filter((option) => !values.includes(option))
            .map((option) => (
              <option key={id + "-opt-" + option} value={option} />
            ))}
        </datalist>
      </fieldset>
      <style jsx>{`
        input {
          width: 100%;
        }
        li {
          color: var(--accent-color);
        }
        .chip {
          /* @apply cursor-pointer */
          border: 1px solid #aaa;
          border-radius: 0.25rem;
          background-color: #fff;
          padding: 0.25rem;
          margin-right: 0.125rem;
        }
        .reset-chip::after {
          content: "×";
          color: #aaa;
        }
      `}</style>
    </>
  );
}

/**
 * @param props
 * @param props.services maps service name => IAM prefix
 */
export default function SearchAdvanced({
  services,
  initialAccessLevels,
}: {
  services: Record<string, string>;
  initialAccessLevels: Record<AccessLevelName, boolean>;
}) {
  const router = useRouter();
  const [actionQuery, setActionQuery] = useState("");
  const [serviceQuery, setServiceQuery] = useState([] as string[]);
  const [prefixQuery, setPrefixQuery] = useState([] as string[]);
  const [accessLevels, setAccess] = useState(
    initialAccessLevels ?? defaultLevels(),
  );
  const _services = [...new Set(Object.keys(services))].sort(); // TODO: useMemo()
  const _prefixes = [...new Set(Object.values(services))].sort();
  const [results, setResults] = useState([] as Action[]);
  const [limit, setLimit] = useState(100);
  const submit = () => {
    // TODO: useCallback?
    let _access = "";
    if (accessLevels[AccessLevelName.Unknown]) _access += "u";
    if (accessLevels[AccessLevelName.Read]) _access += "r";
    if (accessLevels[AccessLevelName.List]) _access += "l";
    if (accessLevels[AccessLevelName.Write]) _access += "w";
    if (accessLevels[AccessLevelName.Tagging]) _access += "t";
    if (accessLevels[AccessLevelName.Permissions]) _access += "p";
    let query = "";
    query += "?prefixes=" + encodeURIComponent(prefixQuery.join(","));
    query += "&services=" + encodeURIComponent(serviceQuery.join(","));
    query += "&action=" + encodeURIComponent(actionQuery);
    query += "&accessLevel=" + encodeURIComponent(_access);
    let _url = "/advanced" + query;
    console.log("setting route => " + _url);
    router.replace(_url);
    fetch("/api/v0/actions/advanced_search" + query)
      .then((r) => {
        if (r.ok) return r.json();
        else throw new Error("failed to fetch actions");
      })
      .then((results) => setResults(results));
  };

  return (
    <>
      <form
        className="container"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <MultiSelect
          options={_services}
          id="services"
          placeholder="Filter actions by one or more services"
          values={serviceQuery}
          setValues={setServiceQuery}
          legend="Services"
        />
        <MultiSelect
          id="prefixes"
          options={_prefixes}
          placeholder="Filter actions by one or more prefixes"
          values={prefixQuery}
          setValues={setPrefixQuery}
          legend="Prefixes"
        />
        <fieldset>
          <label>
            Action name
            <input
              value={actionQuery}
              onChange={(e) => setActionQuery(e.target.value)}
              type="text"
              pattern="[a-zA-Z0-9]+"
              placeholder="Filter by action name"
            />
          </label>
        </fieldset>
        <fieldset>
          <legend>Access Levels</legend>
          {levels.map((level) => (
            <li key={level}>
              <label>
                <input
                  type="checkbox"
                  checked={!!accessLevels[level]}
                  onChange={(e) => {
                    setAccess({ ...accessLevels, [level]: e.target.checked });
                  }}
                ></input>
                {level || "Unknown"}
              </label>
            </li>
          ))}
        </fieldset>
        <fieldset>
          <label>
            Limit
            <input
              type="number"
              min={-1}
              max={1_000_000}
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            />
          </label>
        </fieldset>
        <button>Submit</button>
      </form>
      <output
        className="container"
        style={{ display: results.length ? "block" : "none" }}
      >
        <ActionFilter
          actions={results}
          anyDependentActions={results.some((a) => a.dependent_actions)}
        />
      </output>
    </>
  );
}