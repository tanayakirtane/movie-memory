import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  return {
    // Ancestor lockfiles should not change this standalone project’s tracing root.
    outputFileTracingRoot: process.cwd(),
    // Keep production builds from overwriting a running dev server’s files.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  };
}
