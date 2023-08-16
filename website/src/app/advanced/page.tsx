import SearchAdvanced from "@/components/SearchAdvanced";
import { baseUrl } from "@/lib/baseUrl";
import { getAccessLevels } from "@/lib/types";

export const runtime = "edge";

export default async function Page({
  searchParams,
}: {
  searchParams: { accessLevel?: string };
}) {
  const accessLevels = getAccessLevels(searchParams.accessLevel);
  const services = await fetch(`${baseUrl()}/api/v0/services?limit=-1`)
    .then((res) => res.json())
    .then((services: Array<{ service: string; prefix: string }>) =>
      services.reduce(
        (a, { service, prefix }) => {
          a[service] = prefix;
          return a;
        },
        {} as Record<string, string>,
      ),
    );
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <SearchAdvanced initialAccessLevels={accessLevels} services={services} />
    </main>
  );
}
