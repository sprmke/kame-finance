import { describe, expect, test } from "vitest";

import {
  googleAccessTokenNeedsRefresh,
  mergeGoogleTokenCredentials,
  TOKEN_EXPIRY_SKEW_MS,
} from "./google-tokens";

describe("googleAccessTokenNeedsRefresh", () => {
  test("does not refresh when the access token is still valid", () => {
    expect(
      googleAccessTokenNeedsRefresh({
        access_token: "ya29.valid",
        refresh_token: "1//refresh",
        expiry_date: Date.now() + 60 * 60 * 1000,
      }),
    ).toBe(false);
  });

  test("refreshes when expiry is inside the skew window", () => {
    expect(
      googleAccessTokenNeedsRefresh({
        access_token: "ya29.soon",
        refresh_token: "1//refresh",
        expiry_date: Date.now() + TOKEN_EXPIRY_SKEW_MS - 1_000,
      }),
    ).toBe(true);
  });

  test("refreshes when expiry is missing even if an access token exists", () => {
    expect(
      googleAccessTokenNeedsRefresh({
        access_token: "ya29.no-expiry",
        refresh_token: "1//refresh",
      }),
    ).toBe(true);
  });

  test("does not refresh when there is no refresh token", () => {
    expect(
      googleAccessTokenNeedsRefresh({
        access_token: "ya29.only",
        expiry_date: Date.now() - 60_000,
      }),
    ).toBe(false);
  });
});

describe("mergeGoogleTokenCredentials", () => {
  test("keeps the existing refresh token when Google omits a new one", () => {
    const merged = mergeGoogleTokenCredentials(
      {
        access_token: "old-access",
        refresh_token: "1//keep-me",
        expiry_date: 1,
        userId: "user-1",
        googleAccountId: "acct-1",
      },
      {
        access_token: "new-access",
        expiry_date: 2,
      },
    );

    expect(merged.refresh_token).toBe("1//keep-me");
    expect(merged.access_token).toBe("new-access");
    expect(merged.expiry_date).toBe(2);
    expect(merged.userId).toBe("user-1");
    expect(merged.googleAccountId).toBe("acct-1");
  });

  test("stores a rotated refresh token when Google issues one", () => {
    const merged = mergeGoogleTokenCredentials(
      {
        access_token: "old-access",
        refresh_token: "1//old",
      },
      {
        access_token: "new-access",
        refresh_token: "1//rotated",
      },
    );

    expect(merged.refresh_token).toBe("1//rotated");
  });
});
