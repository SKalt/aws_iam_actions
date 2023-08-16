import { db } from "@/lib/binding";
import { parseParams } from "@/lib/getQueryParams";
import { NextResponse } from "next/server";

export const runtime = "edge";

/*
/api/v0/search[?q=prefix:action]][&limit=number]
/api/v0/search[?q=general]][&limit=number]
a negative limit means no limit

*/
const actionPattern = /^(?<prefix>[a-z0-9]*):(?<action>[a-zA-Z0-9-]+)/;
export async function GET(request: Request) {
  // TODO: be able to respond as text/csv or text/tsv
  let [{ q, limit }, errs] = parseParams(new URL(request.url).searchParams);

  if (errs.length > 0) return NextResponse.json(errs, { status: 400 });
  if (!q) return NextResponse.json([], { status: 200 });
  let match = actionPattern.exec(q)?.groups;
  if (match) {
    let { prefix, action } = match;
    let actionInfo = await db
      .prepare(
        `
          SELECT
            prefix || ':' || action as name
            , 'action' as kind
            , null AS link
          FROM actions
          WHERE prefix = ?1 AND lower(action) LIKE ?2 || '%'
          LIMIT ?3
        `,
      )
      .bind(prefix, action.toLowerCase(), limit)
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
        SELECT name, kind, link
        FROM (
          SELECT
            name
            , 'service' as kind
            , null as link
            , (
                CASE
                  WHEN lower(name) = ?1 THEN 100
                  WHEN lower(name) LIKE ?1 || '%' THEN 50
                  ELSE 1
                END
              ) as score
          FROM services
          WHERE lower(name) LIKE '%' || ?1 || '%'

          UNION ALL
          SELECT
            name
            , 'prefix' as kind
            , null as link
            , (
                CASE
                  WHEN lower(name) = ?1 THEN 100
                  WHEN lower(name) LIKE ?1 || '%' THEN 50
                  ELSE 1
                END
              ) as score
          FROM prefixes
          WHERE lower(name) LIKE '%' || ?1 || '%'

          UNION ALL
          SELECT
             prefix || ':' || action AS name --(select name from prefixes AS prefix where prefix.id = prefix_id ) || ':' || action as name
            , 'action' as kind
            , action_docs_link as link
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
