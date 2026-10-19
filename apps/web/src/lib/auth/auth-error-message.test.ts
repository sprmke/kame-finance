import { describe, expect, test } from "vitest";

import { authErrorMessage } from "./auth-error-message";

describe("authErrorMessage", () => {
  test("explains a missing Google provider", () => {
    expect(authErrorMessage("Configuration")).toBe(
      "Google sign-in is not configured.",
    );
  });

  test("falls back for unknown errors", () => {
    expect(authErrorMessage("OAuthCallback")).toBe(
      "Something went wrong while signing you in. Please try again.",
    );
  });
});
