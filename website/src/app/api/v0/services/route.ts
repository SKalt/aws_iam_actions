import { db } from "@/lib/binding";
import { getGeneralQuery, getLimit, multiParse } from "@/lib/getQueryParams";
import { NextResponse } from "next/server";

export const runtime = "edge";

const query = `
  SELECT
    name AS service
    , (
      select prefix.name
      from prefixes as prefix
      where prefix.id = (
        select prefix_id
        from _actions
        where service_id = service.id limit 1
      )
    ) AS prefix
  FROM services AS service
  WHERE lower(service.name) LIKE '%' || ?1 || '%'
  ORDER BY (
    CASE
      WHEN lower(service.name) = ?1 THEN 100
      WHEN lower(service.name) LIKE ?1 || '%' THEN 50
      ELSE 1 END
  ) DESC
  LIMIT ?2
`;

const searchServices = async (
  q: string,
  limit: number,
): Promise<Array<{ service: string; prefix: string }>> => {
  return db
    .prepare(query)
    .bind(q, limit)
    .all()
    .then(
      ({ results }) => results as Array<{ service: string; prefix: string }>,
    );
};
const parseParams = multiParse({
  q: getGeneralQuery,
  limit: getLimit,
});

export async function GET(request: Request) {
  let [{ q, limit }, errs] = parseParams(new URL(request.url).searchParams);
  if (errs.length > 0) return NextResponse.json(errs, { status: 400 });
  return NextResponse.json(await searchServices(q, limit));
}
