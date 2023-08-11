import { db } from "@/lib/binding";
import Link from "next/link";
import { notFound } from "next/navigation";

const getServices = async (prefix: string) => {
  return db
    .prepare(
      `select distinct service from actions where lower(prefix) = lower(?)`,
    )
    .bind(prefix)
    .all()
    .then((r) => r.results as { service: string }[]);
};

export default async function Page({ params }: { params: { prefix: string } }) {
  const services = await getServices(params.prefix);
  if (!services.length) return notFound();
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1>
        {params.prefix}
        <span className="info">
          (Service{services.length === 1 ? "" : "s"}:
          {services.map(({ service }) => (
            <Link key={service} href={`/service/${service}`}>
              {service}
            </Link>
          ))}
          )
        </span>
      </h1>
    </main>
  );
}
