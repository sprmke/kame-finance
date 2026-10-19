/** Credentials provider id. Development only — never registered in production. */
export const DEV_LOCAL_AUTH_PROVIDER_ID = "local-dev";

export const DEV_LOCAL_AUTH_EMAIL = "dev@localhost";

export function isDevLocalAuthEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
