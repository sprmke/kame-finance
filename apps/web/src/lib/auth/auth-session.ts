/** Shared NextAuth JWT session so middleware and Node auth stay aligned. */
export const AUTH_SESSION = {
  strategy: "jwt",
  /** Keep the dashboard session for a month so Google login is not a daily ritual. */
  maxAge: 30 * 24 * 60 * 60,
  /** Re-issue the JWT when the user is active so it does not silently hit maxAge. */
  updateAge: 24 * 60 * 60,
} as const;
