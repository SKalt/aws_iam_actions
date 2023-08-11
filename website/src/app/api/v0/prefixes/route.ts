import { db } from "@/lib/binding";
import { getLimit, getPrefixQuery, multiParse } from "@/lib/getQueryParams";
import type { Action } from "@/lib/types";
import { D1Result } from "@cloudflare/workers-types";
import { NextResponse } from "next/server";
export const runtime = "edge";

type PrefixResult = {
  service: string;
  prefix: string;
};
// FIXME: add filter for access_level
const query = `
SELECT service, prefix
FROM (
  SELECT
    distinct prefix, service,
    (
      CASE
        WHEN lower(service) = ?1 THEN 100
        WHEN lower(prefix)  LIKE ?1 || '%' THEN 10
        ELSE 1
      END
    ) AS score
  FROM actions
  WHERE '%' || ?1 || '%' LIKE service
) AS results
ORDER BY score DESC
LIMIT ?2
`;
const getActions = async (
  q: string,
  limit: number,
): Promise<D1Result<Action>> => {
  return db.prepare(query).bind(q, limit).all();
};
const parseQuery = multiParse({ q: getPrefixQuery, limit: getLimit });

export async function GET(request: Request) {
  // const contentType = request.headers.get("Content-type");
  // if (contentType !== null && contentType !== "application/json") {
  //   return new Response(`unsupported content-type: ${contentType}`, {status: 404})
  // }
  let [{ q, limit }, errs] = parseQuery(new URL(request.url).searchParams);
  if (errs.length > 0) {
    return NextResponse.json(errs, { status: 400 });
  }
  const result = await getActions(q, limit);
  if (result.error) {
    return new Response(result.error, { status: 500 });
  }
  return NextResponse.json(result.results);
}
