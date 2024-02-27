import ActionFilter from "@/components/ActionFilter";
import { baseUrl } from "@/lib/baseUrl";
import type { Action } from "@/lib/types";
import { notFound } from "next/navigation";
export const runtime = "edge";

const getActions = async (prefix: string): Promise<Action[]> => {
  const _prefix = decodeURIComponent(prefix.toLowerCase());
  const url = `${baseUrl()}/api/v0/actions/?limit=-1&prefix=${_prefix}`;
  return await fetch(url).then((r) => r.json());
};

export default async function Page({
  params: { prefix },
}: {
  params: { prefix: string };
}) {
  if (!prefix) {
    console.error("missing service: ", arguments);
    return notFound();
  }
  try {
    prefix = decodeURIComponent(prefix);
  } catch (e) {
    if (e instanceof URIError) {
      return notFound();
    }
    throw e;
  }
  const actions = await getActions(prefix);
  if (!actions.length) {
    console.error(`no such prefix: ${prefix}`);
    return notFound();
  }
  const services = [...new Set(actions.map((a) => a.service))].sort();
  const anyDependentActions = actions.some((a) => a.dependent_actions);
  return (
    <main className="flex min-h-screen flex-col items-center m-auto p-8">
      <h1 className="font-mono">{prefix}</h1>
      <h2 className="accent">
        (Service{services.length > 1 ? "s" : ""}: {services.join(", ")})
      </h2>
      <ActionFilter
        actions={actions}
        anyDependentActions={anyDependentActions}
        limit={-1}
      />
    </main>
  );
}
