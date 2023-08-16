import { db } from "@/lib/binding";
import {
  getAccessLevel,
  getActionQuery,
  getLimit,
  getPrefixQuery,
  getServiceQuery,
  multiParse,
} from "@/lib/getQueryParams";
import { AccessLevel, Action } from "@/lib/types";
import { D1Result } from "@cloudflare/workers-types";
import { NextResponse } from "next/server";
export const runtime = "edge";

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
WHERE (
    lower(service.name) = ?1
    OR lower(prefix.name) = ?2
  )
  AND (
    access_level.id >= ?3
    AND access_level.id <= ?4
  )
LIMIT ?5
`;
const getActions = async (
  service: string,
  prefix: string,
  minAccessLevel: AccessLevel = AccessLevel.Unknown,
  maxAccessLevel: AccessLevel = AccessLevel.Permissions,
  limit: number,
): Promise<D1Result<Action>> => {
  return db
    .prepare(query)
    .bind(service, prefix, minAccessLevel, maxAccessLevel, limit)
    .all();
};

/*
/api/v0/actions[?service=string][&prefix=string][&action=string]][&limit=number]
-limit means no limit

*/
const parseParams = multiParse({
  service: getServiceQuery,
  prefix: getPrefixQuery,
  action: getActionQuery,
  minAccessLevel: getAccessLevel("min", AccessLevel.Unknown),
  maxAccessLevel: getAccessLevel("max", AccessLevel.Permissions),
  limit: getLimit,
});

export async function GET(request: Request) {
  // const contentType = request.headers.get("Content-type");
  // if (contentType !== null && contentType !== "application/json") {
  //   return new Response(`unsupported content-type: ${contentType}`, {status: 404})
  // }
  let [
    { service, prefix, action, minAccessLevel, maxAccessLevel, limit },
    errs,
  ] = parseParams(new URL(request.url).searchParams);
  if (errs.length > 0) {
    return NextResponse.json(errs, { status: 400 });
  }
  const result = await getActions(
    service,
    prefix,
    minAccessLevel,
    maxAccessLevel,
    limit,
  );
  if (result.error) {
    return new Response(result.error, { status: 500 });
  }
  return NextResponse.json(result.results);
}
