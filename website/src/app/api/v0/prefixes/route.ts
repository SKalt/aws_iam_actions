import { db } from "@/lib/binding";
import { getLimit, getQueryString, multiParse } from "@/lib/getQueryParams";
import type { Action } from "@/lib/types";
import { D1Result } from "@cloudflare/workers-types";
import { NextResponse } from "next/server";
export const runtime = "edge";

type PrefixResult = {
  service: string;
  prefix: string;
};
const query = `
SELECT distinct service, prefix
FROM actions
WHERE service LIKE '%' || ?1 || '%'
ORDER BY (
  CASE
    WHEN lower(service) = ?1 then 100
    WHEN lower(service) LIKE ?1 || '%' then 50
    ELSE 1
  END
)
LIMIT ?2
`;
const getPrefixes = async (
  q: string,
  limit: number,
): Promise<D1Result<Action>> => {
  return db.prepare(query).bind(q.toLowerCase(), limit).all();
};
const parseQuery = multiParse({
  service: getQueryString("service", /^[a-z0-9-]+$/),
  limit: getLimit,
});

export async function GET(request: Request) {
  let [{ service, limit }, errs] = parseQuery(
    new URL(request.url).searchParams,
  );
  if (errs.length > 0) {
    return NextResponse.json(errs, { status: 400 });
  }
  const result = await getPrefixes(service, limit);
  if (result.error) {
    return new Response(result.error, { status: 500 });
  }
  return NextResponse.json(result.results);
}
