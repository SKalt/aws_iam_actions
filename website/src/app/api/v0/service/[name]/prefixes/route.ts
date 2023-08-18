import { db } from "@/lib/binding";
import { NextResponse } from "next/server";

export const runtime = "edge";

const getService = async (name: string) => {
  return db
    .prepare(
      `
      SELECT distinct prefix
      FROM actions
      WHERE lower(service) = lower(?)
    `,
    )
    .bind(name)
    .all()
    .then((r) => (r.results as { prefix: string }[]).map((r) => r.prefix));
};

// this endpoint is used by app/service/[service]/route.ts
export async function GET(
  _: Request,
  { params: { name } }: { params: { name: string } },
) {
  return NextResponse.json(await getService(name));
}
