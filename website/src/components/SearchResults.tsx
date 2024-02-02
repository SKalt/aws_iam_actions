import type { SearchResult as Result } from "@/lib/types";
import Link from "next/link";
import styles from "./SearchResults.module.css";

export function HighlightedName({ name, q }: { name: string; q: string }) {
  let query = q.trim();
  let nonQuerySegments = name.toLowerCase().split(query.toLowerCase());
  let segments = [];
  let len = 0;
  for (let i = 0; i < nonQuerySegments.length - 1; i++) {
    segments.push(name.substring(len, len + nonQuerySegments[i].length));
    len += nonQuerySegments[i].length;
    segments.push(name.substring(len, len + query.length));
    len += query.length;
  }
  segments.push(name.substring(len));
  const id = Math.random().toString(36).substring(4);
  return (
    <span>
      {segments.map((segment, i) => {
        const key = `${id}-${i}`;
        return i % 2 === 0 ? (
          <span key={key}>{serviceNameBreak(segment)}</span>
        ) : (
          <b key={key}>{serviceNameBreak(segment)}</b>
        );
      })}
    </span>
  );
}
/** insert a <wbr/> after each : in a service name */
function serviceNameBreak(text: string) {
  let arr = text.split(':');
  let result = [<>{arr[0]}</>]
  const id = Math.random().toString(36).substring(4);
  for (let i = 0; i < arr.length - 1; i++) {
    const key = `${id}-${i}`;
    result.push(<wbr key={key + "wbr"}/>);
    result.push(<>{arr[i + 1]}</>);
  }
  return result;
}


function SearchResult({ result, q }: { result: Result; q: string }) {
  const link =
    result.link || `/${result.kind}/${encodeURIComponent(result.name)}`;
  const target = result.kind === "action" ? "_blank" : "_self";
  const font = result.kind === "service" ? "" : "font-mono";
  return (
    <li className={styles.result + " container grid grid-cols-2"}>
      <Link href={link} target={target} className={font}>
        <HighlightedName name={result.name} q={q} />
      </Link>
      <span className={styles["bg-info"]}>{result.kind}</span>
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
    <ul className={styles.main}>
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
