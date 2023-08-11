export function debounce<F extends Function>(f: F, ms: number) {
  if (Number.isNaN(ms)) {
    throw new Error("`ms` cannot be NaN");
  }
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    // cancel the previous timeout, if any
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => f(...args), ms);
  };
}

export function debounceFetch(
  f: (controller: AbortController, ...args: any[]) => void,
  ms: number,
): (...args: any[]) => void {
  let controller: AbortController;
  return debounce((...args: any[]) => {
    // abort any in-flight request
    if (controller) controller.abort();
    controller = new AbortController();
    f(controller, ...args);
  }, ms);
}
