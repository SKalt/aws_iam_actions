import { db } from "@/lib/binding";
import { getGeneralQuery, getLimit, multiParse } from "@/lib/getQueryParams";
import type { Action } from "@/lib/types";
import { D1Result } from "@cloudflare/workers-types";
import { NextResponse } from "next/server";

export const runtime = "edge";

// FIXME: add filter for access_level
const query = `
SELECT name, kind, link
FROM (
  SELECT


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
export const parseParams = multiParse({ q: getGeneralQuery, limit: getLimit });

/*
/api/v0/search[?q=prefix:action]][&limit=number]
/api/v0/search[?q=general]][&limit=number]
-limit means no limit

*/
const actionPattern = /(?<prefix>[a-z0-9]*):(?<action>[a-zA-Z0-9])/;
export async function GET(request: Request) {
  // const contentType = request.headers.get("Content-type");
  // if (contentType !== null && contentType !== "application/json") {
  //   return new Response(`unsupported content-type: ${contentType}`, {status: 404})
  // }
  let [{ q, limit }, errs] = parseParams(new URL(request.url).searchParams);

  if (errs.length > 0) return NextResponse.json(errs, { status: 400 });
  if (!q) return NextResponse.json([], { status: 200 });
  let match = actionPattern.exec(q)?.groups;
  if (match) {
    let { prefix, action } = match;
    let actionInfo = await db
      .prepare(
        `
          SELECT prefix || ':' || action as name, 'action' as kind
          FROM actions
          WHERE prefix = ?1 AND lower(action) LIKE ?2 || '%'
        `,
      )
      .bind(prefix, action.toLowerCase())
      .all();
    return NextResponse.json(
      actionInfo.results as Array<{
        action: string;
        table_link: string;
        action_docs_link: string;
      }>,
      {
        status: 200,
      },
    );
  } else {
    const result = await db
      .prepare(
        `
        SELECT name, kind
        FROM (
          SELECT
            distinct service as name
            , prefix
            , 'service' as kind
            , (
                CASE
                  WHEN lower(service) = ?1 THEN 100
                  WHEN lower(service) LIKE ?1 || '%' THEN 50
                  ELSE 1
                END
              ) as score
          FROM actions
          WHERE lower(service) LIKE '%' || ?1 || '%'

          UNION ALL
          SELECT
            distinct prefix as name
            , prefix
            , 'prefix' as kind
            , (
                CASE
                  WHEN lower(prefix) = ?1 THEN 100
                  WHEN lower(prefix) LIKE ?1 || '%' THEN 50
                  ELSE 1
                END
              ) as score
          FROM actions
          WHERE lower(prefix) LIKE '%' || ?1 || '%'

          UNION ALL
          SELECT
            prefix || ':' || action as name
            , prefix
            , 'action' as kind
            , (
              CASE
                WHEN lower(action) = ?1 THEN 100
                WHEN lower(action) LIKE ?1 || '%' THEN 50
                ELSE 1
              END
            ) as score
          FROM actions
          WHERE lower(action) LIKE '%' || ?1 || '%'
        )
        ORDER BY score DESC
        LIMIT ?2
    `,
      )
      .bind(q.toLowerCase(), limit)
      .all();
    return NextResponse.json(result.results);
  }
}
