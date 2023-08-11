import ActionFilter from "@/components/ActionFilter";
import { db } from "@/lib/binding";
import { Action } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

const getPrefixes = async (name: string) => {
  return db
    .prepare(
      `select distinct prefix from actions where lower(service) = lower(?)`,
    )
    .bind(name)
    .all()
    .then((r) => r.results as { prefix: string }[]);
};

const getService = async (name: string) => {
  return db
    .prepare(
      `SELECT
        service
        , prefix
        , action
        , access_level
        , "table_link"
        , "action_docs_link"
        , "condition_keys"
        , "dependent_actions"FROM actions
        WHERE lower(service) = lower(?)`,
    )
    .bind(name)
    .all()
    .then((r) => r.results as Action[]);
};
export default async function Page({
  params: { name },
}: {
  params: { name: string };
}) {
  if (!name) return notFound();
  const [actions, prefixes] = await Promise.all([
    getService(name),
    getPrefixes(name),
  ]);
  if (!prefixes.length) return notFound();
  const anyDependentActions = actions.some((a) => a.dependent_actions);
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1>
        {name}
        <span className="info">
          (prefix{prefixes.length === 1 ? "" : "es"}:{" "}
          {prefixes.map(({ prefix }) => (
            <Link key={prefix} href={`/prefix/${prefix}`}>
              {prefix}
            </Link>
          ))}
          )
        </span>
      </h1>
      <ActionFilter
        actions={actions}
        anyDependentActions={anyDependentActions}
      />
    </main>
  );
}
