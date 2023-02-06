import type { KVNamespace } from "@cloudflare/workers-types";

declare global {
  const STORE: KVNamespace;
}
