import { NextResponse } from "next/server";
export const runtime = "edge";

export const GET = async (
  req: Request,
  { params: { service } }: { params: { service: string } },
) => {
  const baseUrl = new URL(req.url).origin;
  if (!service) return new Response("missing action", { status: 400 });
  try {
    service = decodeURIComponent(service || "");
  } catch (e) {
    if (e instanceof URIError) {
      return new Response("bad action", { status: 400 });
    }
    throw e;
  }

  const prefixes: string[] = await fetch(
    `${baseUrl}/api/v0/service/${encodeURIComponent(service)}/prefixes`,
  ).then((r) => r.json());

  if (prefixes.length === 0) {
    return new Response(`service not found: '${service}'`, { status: 404 });
  } else if (prefixes.length === 1) {
    const [prefix] = prefixes;
    return NextResponse.redirect(
      new URL(`${baseUrl}/prefix/${encodeURIComponent(prefix)}` as string),
    );
  } else {
    return NextResponse.redirect(
      `${baseUrl}/service/${encodeURIComponent(service)}/prefixes`,
    );
  }
};
