import { db } from "@/lib/binding";
import { parseAdvancedSearchParams } from "@/lib/getQueryParams";
import { AccessLevel, Action } from "@/lib/types";
import { D1Result } from "@cloudflare/workers-types";
import { NextResponse } from "next/server";
export const runtime = "edge";

// D1 doesn't support binding `string[]` query-parameters for `IN ?`.
// However, D1 but does provide modern sqlite3 JSON functions.
// This means we can use `IN (select value from json_each(?))` to mimic
// `IN ? -- string[]`
const query = `
SELECT
  service.name AS service
  , prefix.name AS prefix
  , _actions.action AS action
  , access_level.name AS access_level
  , _actions.condition_keys
  , _actions.dependent_actions
  , 'https://docs.aws.amazon.com/service-authorization/latest/reference/' || _actions.table_link AS table_link
  , 'https://docs.aws.amazon.com/' || _actions.action_docs_link AS action_docs_link
FROM _actions
INNER JOIN services AS service ON service.id = _actions.service_id
INNER JOIN prefixes AS prefix ON prefix.id = _actions.prefix_id
FULL OUTER JOIN access_levels AS access_level ON access_level.id = _actions.access_level_id
WHERE
  (
    CASE WHEN (json_type(?1) = 'array') THEN
      lower(service.name) IN (select value from json_each(?1))
    ELSE true
    END
  )
  AND (
    CASE WHEN (json_type(?2) = 'array') THEN
      lower(prefix.name) IN (select value from json_each(?2))
    ELSE true
    END
  )
  AND (access_level.id IN (select value from json_each(?3)))
  AND (_actions.action LIKE ?4)
LIMIT ?5
`;
const getActions = async (
  services: string[],
  prefixes: string[],
  accessLevels: AccessLevel[],
  actionName: string,
  limit: number,
): Promise<D1Result<Action>> => {
  const stringify = (arr: string[]) => JSON.stringify(arr.length ? arr : null);
  const params = [
    stringify(services),
    stringify(prefixes),
    JSON.stringify(accessLevels),
    (actionName || '%').replaceAll(/[*]+/g, "%") , // safe since param is string-escaped
    limit,
  ];
  return db
    .prepare(query)
    .bind(...params)
    .all();
};

export async function GET(request: Request) {
  const contentType = request.headers.get("content-type");
  if (contentType !== null && contentType !== "application/json") {
    return new Response(`unsupported content-type: ${contentType}`, {
      status: 404,
    });
  }
  let [{ services, prefixes, actionName, accessLevels, limit }, errs] =
    parseAdvancedSearchParams(new URL(request.url).searchParams);
  if (errs.length > 0) {
    return NextResponse.json(errs, { status: 400 });
  }

  const result = await getActions(
    services,
    prefixes,
    accessLevels,
    actionName,
    limit,
  );
  if (result.error) {
    return new Response(result.error, { status: 500 });
  }
  return NextResponse.json(result.results);
}
