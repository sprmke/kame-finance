import { describe, expect, test } from "vitest";

import {
  GOOGLE_LOGIN_AUTHORIZATION_PARAMS,
  GOOGLE_RECONNECT_AUTHORIZATION_PARAMS,
} from "./google-oauth-params";
import { GOOGLE_OAUTH_SCOPE_STRING } from "./google-scopes";

describe("Google OAuth authorization params", () => {
  test("login requests offline access without forcing consent every visit", () => {
    expect(GOOGLE_LOGIN_AUTHORIZATION_PARAMS).toMatchObject({
      scope: GOOGLE_OAUTH_SCOPE_STRING,
      access_type: "offline",
      prompt: "select_account",
    });
    expect(GOOGLE_LOGIN_AUTHORIZATION_PARAMS.prompt).not.toBe("consent");
  });

  test("reconnect/link still forces consent so Google returns a refresh token", () => {
    expect(GOOGLE_RECONNECT_AUTHORIZATION_PARAMS).toMatchObject({
      access_type: "offline",
      prompt: "consent",
    });
  });
});
