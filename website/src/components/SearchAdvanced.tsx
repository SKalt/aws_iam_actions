"use client";

import { AccessLevelName, Action } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import ActionFilter, { fuzzyFilter } from "./ActionFilter";
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
  options = [],
  placeholder,
  id,
  values,
  mono,
  setValues,
}: {
  legend: string;
  id: string;
  placeholder: string;
  options: Array<{ lower: string; display: string }>;
  values: string[];
  mono: boolean;
  setValues: (values: string[]) => void;
}) {
  const ref = useRef(null);
  const [search, setSearch] = useState("");
  const unusedOptions = options.filter((v) => !values.includes(v.lower));
  const matchingOptions = fuzzyFilter(
    unusedOptions.map((v) => v.lower),
    search,
    5,
  ).map((i) => unusedOptions[i]);
  const select = (opt: string) => {
    setValues([...values, opt]);
    setSearch("");
    if (ref.current) (ref.current as HTMLInputElement).focus();
  };

  return (
    <>
      <fieldset
        className={[styles.fieldset, mono ? styles.mono : null]
          .filter(Boolean)
          .join(" ")}
      >
        <label className="container">
          {legend}
          <input
            ref={ref}
            value={search}
            onChange={(e) => setSearch(e.target.value.toLowerCase())}
            type="search"
            placeholder={placeholder}
            className={[styles["input"]].join(" ")}
          ></input>
        </label>
        <ul className={["mx-auto", styles["select-list"]].join(" ")}>
          {matchingOptions.map((opt) => (
            <li
              key={id + `-` + opt.lower}
              className={["cursor-pointer", styles["accent"]].join(" ")}
              onClick={() => select(opt.lower)}
            >
              {opt.display}
            </li>
          ))}
          {
            /* keep 5 rows no matter the number of results */
            Array(5 - matchingOptions.length)
              .fill(null)
              .map((_, i) => (
                <li key={id + "-" + i + "-" + `-null`}>&nbsp;</li>
              ))
          }
        </ul>
        <output>
          {values.map((value) => (
            <span
              className={["cursor-pointer", styles["chip"]].join(" ")}
              onClick={() => setValues(values.filter((v) => v !== value))}
              key={id + `-reset-` + value}
            >
              {value}
            </span>
          ))}
          <span>&nbsp;</span>
        </output>
      </fieldset>
    </>
  );
}
const alphabetic = (a: { lower: string }, b: { lower: string }) =>
  a.lower > b.lower ? 1 : a.lower == b.lower ? 0 : -1;

const makeServices = (
  serviceEntries: Array<[string, { display: string; prefix: string }]>,
) =>
  serviceEntries
    .map(([lower, { display }]) => ({ lower, display }))
    .sort(alphabetic);

const makePrefixes = (
  serviceEntries: Array<[string, { display: string; prefix: string }]>,
) =>
  serviceEntries
    .map(([_, { prefix }]) => ({ lower: prefix, display: prefix }))
    .sort(alphabetic);
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
  services: Record<string, { display: string; prefix: string }>;
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
  const _services = makeServices(Object.entries(services));
  const _prefixes = makePrefixes(Object.entries(services));
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
    query.set("limit", limit.toString());
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
    Services = "Filter actions by selecting services",
    Prefixes = "Filter actions by selecting prefixes",
    ActionName = "Filter by an action name with wildcards (*)",
  }
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
          options={
            prefixQuery.length
              ? makeServices(
                  Object.entries(services).filter(([lower, _]) =>
                    prefixQuery.includes(lower),
                  ),
                )
              : _services
          }
          id="services"
          placeholder={Placeholder.Services}
          values={serviceQuery}
          setValues={setServiceQuery}
          legend="Services"
          mono={false}
        />
        <MultiSelect
          id="prefixes"
          options={
            serviceQuery.length
              ? makePrefixes(
                  serviceQuery.map((service) => {
                    let result = services[service];
                    if (!result)
                      throw new Error(`service ${service} not found`);
                    return ["", result];
                  }),
                )
              : _prefixes
          }
          placeholder={Placeholder.Prefixes}
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
              placeholder={Placeholder.ActionName}
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
          limit={limit}
        />
      </output>
    </>
  );
}
