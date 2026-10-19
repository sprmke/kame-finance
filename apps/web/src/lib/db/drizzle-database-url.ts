/** Schema tools should use a session URL when one is set, and ignore a blank DIRECT_URL. */
export function drizzleDatabaseUrl(env: {
  DIRECT_URL?: string | null;
  DATABASE_URL?: string | null;
}): string {
  const direct = env.DIRECT_URL?.trim() ?? "";
  if (direct) return direct;
  return env.DATABASE_URL?.trim() ?? "";
}
