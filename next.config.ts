import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `next dev` otherwise appends a managed block to AGENTS.md. On a
   * case-insensitive filesystem that file is this repo's `agents.md` — the
   * project's own governance doc — so the generator is off and the doc stays
   * hand-authored.
   */
  agentRules: false,
};

export default nextConfig;
