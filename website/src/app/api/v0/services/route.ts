import { db } from "@/lib/binding";
import { getQueryParams } from "@/lib/getQueryParams";
import { NextResponse } from "next/server";
export const runtime = "edge";
const allowedSearch = /^([a-z0-9]{1,}|)$/;

const query = `
SELECT service, prefix
FROM (
  SELECT
    service, prefix,
    (
        0
        + CASE WHEN lower(prefix)  like ?1 || '%' THEN 1 ELSE 0 END
        + CASE WHEN lower(service) like ?2 || '%' THEN 1 ELSE 0 END
    ) AS score
  FROM actions
  WHERE (
    false
    OR lower(prefix)  like ?1 || '%'
    OR lower(service) like ?2 || '%'
  )
  GROUP BY service, prefix
) AS results
ORDER BY score DESC
LIMIT ?3
`;
const getServices = async (
  service: string,
  prefix: string,
  limit: number,
): Promise<Record<string, string>> => {
  return db
    .prepare(query)
    .bind(service, prefix, limit)
    .all()
    .then(({ results }) =>
      results.reduce(
        (acc: Record<string, string>, row) => {
          let { service, prefix } = row as { service: string; prefix: string };
          acc[service] = prefix;
          return acc;
        },
        {} as Record<string, string>,
      ),
    );
};

/*
/api/v0/services[?q=string][&limit=number]
/api/v0/services[?service=string][&prefix=string][&action=string]][&limit=number]
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
  if (action) {
    errs.push(`Cannot specify 'action' in search for services`);
  }
  if (q) {
    service = q;
    prefix = q;
  }
  if (errs.length > 0) {
    return NextResponse.json(errs, { status: 400 });
  }
  return NextResponse.json(await getServices(service, prefix, limit));
}
