/**
 * Centralized env access for the web app (mirrors the backend's single-source-of-config rule).
 * The MVP has no external auth provider — the backend resolves the single seeded member.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
