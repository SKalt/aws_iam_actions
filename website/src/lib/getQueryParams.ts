type UrlParams = { get: URLSearchParams["get"] }; // <- we only use `params.get(key)`
// ^ this custom type lets us accept native UrlSearchParams or Next's ReadonlyURLSearchParams

type Parser<T> = (params: UrlParams) => [T, string];
// ^ a parser takes a URLSearchParams and returns a tuple of [parsedValue, errorString]
//   if there is no error, the errorString is an empty string

export const getQueryString =
  (key: string, pattern: RegExp) =>
  (urlParams: UrlParams): [string, string] => {
    const search = (urlParams.get(key) || "").toLowerCase();
    let err = "";
    if (search && !pattern.test(search)) {
      err = `Invalid search: "${search}". Must match ${pattern.toString()}`;
    }
    return [search, err];
  };

export const getGeneralQuery = getQueryString("q", /^[a-zA-Z0-9-. ():]+$/);
export const getServiceQuery = getQueryString("service", /^[a-z0-9]+$/);
export const getActionQuery = getQueryString("action", /^[a-z0-9]+$/);
export const getPrefixQuery = getQueryString("prefix", /^[a-z0-9]+$/);
export const getLimit = (searchParams: UrlParams): [number, string] => {
  let rawLimit = searchParams.get("limit") || "10";
  let limit = parseInt(rawLimit, 10);
  let err = "";
  if (Number.isNaN(limit)) {
    err = `Invalid limit: ${rawLimit}`;
  } else if (limit < 0) {
    limit = 1_000_000_000; // it should take AWS a while to get to a billion actions
  }
  return [limit, err];
};

type ParsedType<P> = P extends Parser<infer U> ? U : never;
type Mapped<Parsers> = Parsers extends Record<string, Parser<any>>
  ? { [K in keyof Parsers]: ParsedType<Parsers[K]> }
  : never;

export const multiParse =
  <Parsers extends Record<string, Parser<any>>>(input: Parsers) =>
  (params: UrlParams): [Mapped<Parsers>, string[]] => {
    let errors: string[] = [];
    let result = Object.entries(input).reduce(
      (acc, [key, parser]) => {
        let [value, err] = parser(params);
        if (err) errors.push(err);
        acc[key] = value;
        return acc;
      },
      {} as Record<string, any>,
    );
    return [result, errors] as [Mapped<Parsers>, string[]];
  };
export const parseParams = multiParse({ q: getGeneralQuery, limit: getLimit });

export const getQuery = (params: UrlParams) => {
  const [result, errors] = multiParse({
    // TODO: hoist this out of getQueryParams
    q: getGeneralQuery,
    service: getServiceQuery,
    prefix: getPrefixQuery,
    action: getActionQuery,
    limit: getLimit,
  })(params);
  if (result.q && (result.service || result.prefix || result.action)) {
    errors.push(
      `Cannot specify both 'q' and any of 'service', 'prefix', or 'action'`,
    );
  }
  return [result, errors] as [typeof result, typeof errors];
};

export const getQueryParams = (url: string) => {
  const { searchParams } = new URL(url);
  return getQuery(searchParams);
};

// TODO: offsets for pagination
