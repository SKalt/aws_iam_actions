import { type D1Database } from "@cloudflare/workers-types";
import { binding } from "cf-bindings-proxy";

export const db = binding<D1Database>("DB");
