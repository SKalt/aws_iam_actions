import {} from "next/navigation";
import { cache } from "react";
export const baseUrl = cache(() => {
  return process.env.CF_PAGES_URL ?? "http://localhost:3000"; // https://developers.cloudflare.com/pages/platform/build-configuration#environment-variables
});
