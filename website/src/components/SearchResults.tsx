import type { SearchResult as Result } from "@/lib/types";
import Link from "next/link";

function HighlightedName({ name, q }: { name: string; q: string }) {
  let query = q.trim();
  let x = name.toLowerCase().split(query.toLowerCase()); // TODO: rename var
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
        i % 2 === 0 ? <span key={i}>{serviceNameBreak(segment)}</span> : <b key={i}>{serviceNameBreak(segment)}</b>,
      )}
    </span>
  );
}
/** insert a <wbr/> after each : in a service name */
function serviceNameBreak(text: string) {
  let arr = text.split(':');
  return arr.slice(1).reduce((acc, r) => {
    acc.push(<wbr />);
    acc.push(<>:{r}</>);
    return acc;
  }, [<>{arr[0]}</>]);
}


function SearchResult({ result, q }: { result: Result; q: string }) {
  const link =
    result.link || `/${result.kind}/${encodeURIComponent(result.name)}`;
  const target = result.kind === "action" ? "_blank" : "_self";
  const font = result.kind === "service" ? "" : "font-mono";
  return (
    <li className="result container grid grid-cols-2">
      <Link href={link} target={target} className={font}>
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
