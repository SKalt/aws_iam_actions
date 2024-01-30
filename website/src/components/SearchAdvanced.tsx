"use client";

import { AccessLevelName, Action } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import ActionFilter from "./ActionFilter";
import styles from "./SearchAdvanced.module.css";

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
  mono,
  setValues,
}: {
  legend: string;
  id: string;
  placeholder: string;
  options: string[];
  values: string[];
  mono: boolean,
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
      <fieldset className={[styles.fieldset, mono ? styles.mono : null].filter(Boolean).join(" ")}>
        <label className="container">
          {legend}
          <input
            ref={ref}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder={placeholder}
            className={[styles["input"]].join(" ")}
          ></input>
        </label>
        <ul className={["mx-auto", styles["select-list"]].join(" ")}>
          {_options.map((opt) => (
            <li
              key={id + `-` + opt}
              className={["cursor-pointer", styles["accent"]].join(" ")}
              onClick={() => select(opt)}
            >
              {opt}
            </li>
          ))}
          {
          /* keep 5 rows no matter the number of results */
          Array(5 - _options.length).fill(null).map((_, i) => (<li
              key={id + `-null`}>&nbsp;</li>))}
        </ul>
        <output>
          {values.map((value) => (
            <span
              className={[
                "cursor-pointer",
                styles["chip"],
              ].join(" ")}
              onClick={() => setValues(values.filter((v) => v !== value))}
              key={id + `-reset-` + value}
            >
              {value}
            </span>
          ))}
          <span>&nbsp;</span>
        </output>
        <datalist id={id}>
          {options
            .filter((option) => !values.includes(option))
            .map((option) => (
              <option key={id + "-opt-" + option} value={option} />
            ))}
        </datalist>
      </fieldset>
    </>
  );
}

/**
 * @param props
 * @param props.services maps service name => IAM prefix
 */
export default function SearchAdvanced({
  services,
  initialActionQuery,
  initialServices,
  initialPrefixes,
  initialAccessLevels,
  initialResults,
}: {
  services: Record<string, string>;
  initialActionQuery: string;
  initialPrefixes: string[];
  initialServices: string[];
  initialAccessLevels: Record<AccessLevelName, boolean>;
  initialResults: Action[];
}) {
  const router = useRouter();
  const [actionQuery, setActionQuery] = useState(initialActionQuery ?? "");
  const [serviceQuery, setServiceQuery] = useState(initialServices ?? []);
  const [prefixQuery, setPrefixQuery] = useState(initialPrefixes ?? []);
  const [accessLevels, setAccess] = useState(
    initialAccessLevels ?? defaultLevels(),
  );
  const [results, setResults] = useState(initialResults ?? []);
  const [limit, setLimit] = useState(100);
  const _services = [...new Set(Object.keys(services))].sort(); // TODO: useMemo()
  const _prefixes = [...new Set(Object.values(services))].sort();
  const submit = () => {
    // TODO: useCallback?
    let _access = "";
    if (accessLevels[AccessLevelName.Unknown]) _access += "u";
    if (accessLevels[AccessLevelName.Read]) _access += "r";
    if (accessLevels[AccessLevelName.List]) _access += "l";
    if (accessLevels[AccessLevelName.Write]) _access += "w";
    if (accessLevels[AccessLevelName.Tagging]) _access += "t";
    if (accessLevels[AccessLevelName.Permissions]) _access += "p";
    let query = new URLSearchParams();
    if (serviceQuery.length)
      query.set("services", encodeURIComponent(serviceQuery.join(",")));
    if (prefixQuery.length)
      query.set("prefixes", encodeURIComponent(prefixQuery.join(",")));
    if (actionQuery) query.set("action", encodeURIComponent(actionQuery));
    if (_access) query.set("accessLevel", encodeURIComponent(_access));
    let _query = query.toString();
    _query = _query ? "?" + _query : "";
    let _url = "/advanced" + _query;
    router.push(_url);
    fetch("/api/v0/actions/advanced_search" + _query)
      .then((r) => {
        if (r.ok) return r.json();
        else throw new Error("failed to fetch actions");
      })
      .then((results) => setResults(results));
  };

  const enum Placeholder {
    Services = "Filter actions by one or more services",
    Prefixes = "Filter actions by one or more prefixes",
    ActionName = "Filter by a action name with wildcards (*)",
  }
  // console.log(`max placeholder length: ${Math.max(...[Placeholder.ActionName, Placeholder.Prefixes, Placeholder.Services].map((v) => v.length))}`)
  return (
    <>
      <form
        className="container w-full flex flex-wrap "
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <MultiSelect
          options={_services}
          id="services"
          placeholder={Placeholder.Services}
          values={serviceQuery}
          setValues={setServiceQuery}
          legend="Services"
          mono={false}
        />
        <MultiSelect
          id="prefixes"
          options={_prefixes}
          placeholder="Filter actions by one or more prefixes"
          values={prefixQuery}
          setValues={setPrefixQuery}
          legend="Prefixes"
          mono={true}
        />
        <fieldset className={[styles.fieldset, styles.mono].join(" ")}>
          <label>
            Action name
            <input
              className={["container", styles["input"]].join(" ")}
              value={actionQuery}
              onChange={(e) => setActionQuery(e.target.value)}
              type="text"
              pattern="[a-zA-Z0-9*]+"
              placeholder="Filter by a action name with wildcards (*)"
            />
          </label>
        </fieldset>
        <fieldset className={styles.fieldset}>
          <legend>Access Levels</legend>
          <ul className={styles.input}>
            {levels.map((level) => (
              <li key={level}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!accessLevels[level]}
                    onChange={(e) => {
                      setAccess({ ...accessLevels, [level]: e.target.checked });
                    }}
                  />{" "}
                  {level || "Unknown"}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        {/* <fieldset className={styles.fieldset}>
        </fieldset> */}
        <fieldset className={styles.fieldset}>
          <label>
            Limit
            <input
              type="number"
              min={-1}
              max={1_000_000}
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              className={styles["input"]}
            />
          </label>
        </fieldset>
        <button className={styles.btn}>Submit</button>
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
