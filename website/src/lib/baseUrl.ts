import { cache } from "react";

export const baseUrl = cache(() => {
  return process.env.BASEURL ?? "http://localhost:3000";
});
