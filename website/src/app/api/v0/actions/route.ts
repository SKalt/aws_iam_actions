import { db } from "@/lib/binding";
import { getQueryParams } from "@/lib/getQueryParams";
import type { Action } from "@/lib/types";
import { D1Result } from "@cloudflare/workers-types";
import { NextResponse } from "next/server";
export const runtime = "edge";

const columns: Array<keyof Action> = [
  "service",
  "prefix",
  "action",
  "access_level",
  "table_link",
  "action_docs_link",
  "condition_keys",
  "dependent_actions",
];
// FIXME: add filter for access_level
const query = `
SELECT ${columns.join(",")}
FROM (
  SELECT
    ${columns.join(",")},
    (
        0
        + CASE WHEN lower(service) like ?1 || '%' THEN 1 ELSE 0 END
        + CASE WHEN lower(prefix)  like ?2 || '%' THEN 1 ELSE 0 END
        + CASE WHEN lower(action)  like ?3 || '%' THEN 1 ELSE 0 END
    ) AS score
  FROM actions
  WHERE (
    false
    OR lower(service) like ?1 || '%'
    OR lower(prefix)  like ?2 || '%'
    OR lower(action)  like ?3 || '%'
  )
) AS results
ORDER BY score DESC
LIMIT ?4
`;
const getActions = async (
  service: string,
  prefix: string,
  action: string,
  limit: number,
): Promise<D1Result<Action>> => {
  return db.prepare(query).bind(service, prefix, action, limit).all();
};

/*
/api/v0/actions[?q=string][&limit=number]
/api/v0/actions[?service=string][&prefix=string][&action=string]][&limit=number]
-limit means no limit

*/
export async function GET(request: Request) {
  // const contentType = request.headers.get("Content-type");
  // if (contentType !== null && contentType !== "application/json") {
  //   return new Response(`unsupported content-type: ${contentType}`, {status: 404})
  // }
  let [{ q, service, prefix, action, limit }, errs] = getQueryParams(
    request.url,
  );
  if (q) {
    service = q;
    action = q;
    prefix = q;
  }
  if (errs.length > 0) {
    return NextResponse.json(errs, { status: 400 });
  }
  const result = await getActions(service, prefix, action, limit);
  if (result.error) {
    return new Response(result.error, { status: 500 });
  }
  return NextResponse.json(result.results);
}
