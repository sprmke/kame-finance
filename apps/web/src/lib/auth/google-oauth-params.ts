import { GOOGLE_OAUTH_SCOPE_STRING } from "@/lib/auth/google-scopes";

/**
 * Sign-in: keep offline access so Google can issue a refresh token on first
 * grant, but do not force the consent screen on every visit. Forcing consent
 * mints a new refresh token each login and can invalidate older ones.
 */
export const GOOGLE_LOGIN_AUTHORIZATION_PARAMS = {
  scope: GOOGLE_OAUTH_SCOPE_STRING,
  access_type: "offline",
  prompt: "select_account",
} as const;

/**
 * Reconnect / link an extra mailbox: force consent so Google always returns a
 * refresh token (it omits one when the user already granted the app).
 */
export const GOOGLE_RECONNECT_AUTHORIZATION_PARAMS = {
  access_type: "offline",
  prompt: "consent",
} as const;
