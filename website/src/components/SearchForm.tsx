"use client";

import { debounceFetch } from "@/lib/debounce";
import type { SearchResult } from "@/lib/types";
import { useRouter } from "next/navigation";
import SearchResults from "./SearchResults";
// ^ make sure to import `useRouter` from `next/navigation` instead of `next/router`
// see https://nextjs.org/docs/messages/next-router-not-mounted
// for an explanation
import { useCallback, useEffect, useState } from "react";

// TODO: debounce general search requests
// TODO: abort fetch of all search requests when any search changes
export default function SearchForm(
  {
    initialQ,
    limit,
    initialResults,
  }: { initialQ: string; limit: number; initialResults: SearchResult[] } = {
    initialQ: "",
    limit: 10,
    initialResults: [],
  },
) {
  const [q, setQ] = useState(initialQ || "");
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>(initialResults ?? []);
  const submitQuery = useCallback(
    debounceFetch((controller, q: string) => {
      if (!q) {
        setResults([]);
        document.title = "Search IAM actions";
        return;
      }
      fetch(`/api/v0/search?q=${q}`, { signal: controller.signal })
        .then((r) => {
          if (r.ok) return r.json() as Promise<SearchResult[]>;
          else throw new Error(r.statusText);
        })
        .then((actions) => setResults(actions))
        .catch((err) => {
          if (err.name !== "AbortError") throw err; // ignore aborted fetches
        });
      router.replace(`?q=${q}`);
      document.title = `IAM Search: ${q}`; // TODO: nicer title
    }, 50),
    [],
  );
  useEffect(
    () => {
      let init = new URL(window.location.href).searchParams.get("q") || "";
      if (q !== init) {
        console.error("Unexpectedly updating local search from URL params");
        setQ(init);
      }
    },
    [] /* <- try to fire the effect only once, on page load */,
  );

  useEffect(() => submitQuery(q), [q]);

  return (
    <div className="container">
      <form
        className="flex container mx-auto"
        onSubmit={(e) => e.preventDefault()}
      >
        <input
          type="search"
          pattern="[a-zA-Z0-9. _\[\]\-\(\)]+"
          className="flex-grow"
          placeholder="Filter by service name, IAM prefix, or action"
          value={q}
          onChange={(e) => {
            if (e.target.validity.valid) setQ(e.target.value);
          }}
        />
      </form>
      <SearchResults q={q} results={results} />
    </div>
  );
}
