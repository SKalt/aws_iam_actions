import type { SearchResult as Result } from "@/lib/types";
import Link from "next/link";

function HighlightedName({ name, q }: { name: string; q: string }) {
  let query = q.trim();
  let x = name.toLowerCase().split(query.toLowerCase());
  let segments = [];
  let len = 0;
  for (let i = 0; i < x.length - 1; i++) {
    segments.push(name.substring(len, len + x[i].length));
    len += x[i].length;
    segments.push(name.substring(len, len + query.length));
    len += query.length;
  }
  segments.push(name.substring(len));
  return (
    <span>
      {segments.map((segment, i) =>
        i % 2 === 0 ? <span key={i}>{segment}</span> : <b key={i}>{segment}</b>,
      )}
    </span>
  );
}

function SearchResult({ result, q }: { result: Result; q: string }) {
  // TODO: bold the matching segments
  const link = `/${result.kind}/${result.name}`;
  const target = result.kind === "action" ? "_blank" : "_self";
  return (
    <li className="result container grid grid-cols-2">
      <Link href={link} target={target}>
        <HighlightedName name={result.name} q={q} />
      </Link>
      <span className="bg-info">{result.kind}</span>
    </li>
  );
}

export default function SearchResults({
  results,
  q,
}: {
  results: Result[];
  q: string;
}) {
  return (
    <ul>
      {results.map((result) => (
        <SearchResult
          result={result}
          q={q}
          key={`${result.kind}/${result.name}`}
        />
      ))}
    </ul>
  );
}
