import { db } from "@/lib/binding";
import { NextResponse } from "next/server";
export const runtime = "edge";
const pattern = /^(?<prefix>[a-z0-9-]{2,}):(?<name>[a-zA-Z0-9]{1,})$/;
export const GET = async (
  _: Request,
  { params: { action } }: { params: { action: string } },
) => {
  if (!action) {
    return new Response("missing action", { status: 400 });
  }
  let match = pattern.exec(action)?.groups;
  if (!match) {
    return new Response(`invalid action: '${action}'`, { status: 400 });
  }
  let { prefix, name } = match;
  let result = await db
    .prepare(
      "SELECT action_docs_link FROM actions WHERE prefix = ? and action = ? LIMIT 1",
    )
    .bind(prefix, name)
    .first();
  if (!result) {
    return new Response(`action not found: '${action}'`, { status: 404 });
  }
  return NextResponse.redirect(new URL(result.action_docs_link as string));
};
