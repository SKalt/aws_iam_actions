import SearchForm from "@/components/SearchForm";
import { parseBasicSearchParams } from "@/lib/getQueryParams";
// https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props
import { baseUrl } from "@/lib/baseUrl";

export const runtime = "edge";

const getServerSideProps = async (searchParams: URLSearchParams) => {
  let [{ q, limit }, errs] = parseBasicSearchParams(searchParams);
  // FIXME: handle query-string errors
  const url = `${baseUrl()}/api/v0/search?q=${q}`;
  const results = await fetch(url).then((r) =>
    r.json().catch((e) => {
      console.error(e);
      return [];
    }),
  );
  return {
    q,
    limit,
    results,
  };
};

export default async function Main({
  searchParams,
  ...rest
}: {
  searchParams: URLSearchParams;
}) {
  const { q, limit, results } = await getServerSideProps(
    new URLSearchParams(searchParams),
  );
  return (
    <main className="flex min-h-screen flex-col items-center m-auto p-8">
      <h1 className="my-4 text-center">
        Search AWS IAM <span className="highlight">services</span>,{" "}
        <span className="highlight">prefixes</span>, and{" "}
        <span className="highlight">actions</span>
      </h1>
      <SearchForm initialQ={q} limit={limit} initialResults={results} />
    </main>
  );
}
