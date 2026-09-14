/** Refresh a little before real expiry so an in-flight pipeline never races the boundary. */
export const TOKEN_EXPIRY_SKEW_MS = 5 * 60 * 1000;

export type GoogleTokenCredentials = {
  access_token?: string;
  refresh_token?: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
};

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asExpiry(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function googleAccessTokenIsUsable(
  tokens: GoogleTokenCredentials,
): boolean {
  if (!tokens.access_token) return false;
  if (!tokens.expiry_date) return false;
  return tokens.expiry_date - TOKEN_EXPIRY_SKEW_MS > Date.now();
}

/** True when we can (and should) exchange the refresh token for a new access token. */
export function googleAccessTokenNeedsRefresh(
  tokens: GoogleTokenCredentials,
): boolean {
  if (!asString(tokens.refresh_token)) return false;
  return !googleAccessTokenIsUsable(tokens);
}

export type GoogleTokenRefreshPatch = {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  token_type?: string | null;
  scope?: string | null;
};

/**
 * Merge a token refresh response into stored credentials.
 * Google often omits `refresh_token` on refresh; never drop the existing one.
 */
export function mergeGoogleTokenCredentials<T extends GoogleTokenCredentials>(
  existing: T,
  next: GoogleTokenRefreshPatch,
): T {
  return {
    ...existing,
    access_token: asString(next.access_token) ?? existing.access_token,
    refresh_token: asString(next.refresh_token) ?? existing.refresh_token,
    expiry_date: asExpiry(next.expiry_date) ?? existing.expiry_date,
    token_type: asString(next.token_type) ?? existing.token_type,
    scope: asString(next.scope) ?? existing.scope,
  };
}
