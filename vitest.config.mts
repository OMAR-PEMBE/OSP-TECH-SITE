import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Unit tests for the pure logic in `lib/` — formatting, validation,
 * recurrence, link building, redirect safety. Database behaviour (RLS,
 * grants) is verified against a local Supabase, not mocked here.
 */
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    /* Run under a non-EAT zone on purpose: the Dar es Salaam helpers must not
       depend on the machine's timezone, and UTC is what Vercel runs. */
    env: { TZ: "UTC" },
  },
  resolve: {
    alias: {
      /* `server-only` throws when imported outside a React Server environment.
         Tests are server-side code by definition, so it is stubbed out. */
      "server-only": fileURLToPath(
        new URL("./test/server-only-stub.ts", import.meta.url),
      ),
    },
  },
});
