import { db } from "@/lib/binding";
import { NextResponse } from "next/server";

export const runtime = "edge";
// FIXME: use normalize query; ensure this endpoint is actually used

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

export async function GET(
  _: Request,
  { params: { name } }: { params: { name: string } },
) {
  return NextResponse.json(await getService(name));
}
