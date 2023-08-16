import { baseUrl } from "@/lib/baseUrl";
import Link from "next/link";
import { notFound } from "next/navigation";

export const runtime = "edge";

export default async function Page({
  params: { service },
}: {
  params: { service: string };
}) {
  try {
    service = decodeURIComponent(service);
  } catch (e) {
    return notFound();
  }

  let prefixes: string[] = await fetch(
    `${baseUrl()}/api/v0/${encodeURIComponent(service)}`,
  ).then((r) => r.json());
  return (
    <main>
      <h1>{service} IAM prefixes</h1>
      <ul>
        {prefixes.map((prefix) => (
          <li key={prefix}>
            <Link href={`${baseUrl()}/prefix/${prefix}`}>
              <code>{prefix}</code>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
