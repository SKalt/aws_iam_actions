import SearchAdvanced from "@/components/SearchAdvanced";
import { baseUrl } from "@/lib/baseUrl";
import { parseAdvancedSearchParams } from "@/lib/getQueryParams";
import { AccessLevel, AccessLevelName, Action } from "@/lib/types";
export const runtime = "edge";

export default async function Page({
  searchParams,
}: {
  searchParams: {
    accessLevel?: string;
    services?: string;
    prefixes?: string;
    action?: string;
  };
}) {
  let _params = new URLSearchParams(searchParams);
  if (!_params.has("accessLevel")) _params.set("accessLevel", "urlwtp");
  const [params, _errors] = parseAdvancedSearchParams(_params);
  const usingNonDefaultParams =
    params.actionName ||
    params.prefixes.length ||
    params.services.length ||
    _params.get("accessLevel") !== "urlwtp";
  const initialResults: Action[] = usingNonDefaultParams
    ? await fetch(
        `${baseUrl()}/api/v0/actions/advanced_search?${_params.toString()}`,
      ).then((res) => res.json())
    : [];
  const accessLevels = params.accessLevels.reduce(
    (a, level) => {
      let name: AccessLevelName;
      switch (level) {
        case AccessLevel.Read:
          name = AccessLevelName.Read;
          break;
        case AccessLevel.List:
          name = AccessLevelName.List;
          break;
        case AccessLevel.Write:
          name = AccessLevelName.Write;
          break;
        case AccessLevel.Tagging:
          name = AccessLevelName.Tagging;
          break;
        case AccessLevel.Permissions:
          name = AccessLevelName.Permissions;
          break;
        default:
          name = AccessLevelName.Unknown;
          break;
      }
      a[name] = true;
      return a;
    },
    {} as Record<AccessLevelName, boolean>,
  );
  const services = await fetch(`${baseUrl()}/api/v0/services?limit=-1`)
    .then((res) => res.json())
    .then((services: Array<{ service: string; prefix: string }>) =>
      services.reduce(
        (a, { service, prefix }) => {
          a[service.toLowerCase()] = {display: service, prefix};
          return a;
        },
        {} as Record<string, {display: string, prefix: string}>,
      ),
    );
  return (
    <main className="flex min-h-screen flex-col items-center m-auto p-8">
      <h1>Advanced search</h1>
      <SearchAdvanced
        initialAccessLevels={accessLevels}
        initialActionQuery={params.actionName}
        initialPrefixes={params.prefixes}
        initialServices={params.services}
        initialResults={initialResults}
        services={services}
      />
    </main>
  );
}
