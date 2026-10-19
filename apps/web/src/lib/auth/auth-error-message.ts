const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Google sign-in is not configured.",
  AccessDenied: "Sign-in was denied.",
};

export function authErrorMessage(error: string | null | undefined): string {
  if (error && AUTH_ERROR_MESSAGES[error]) {
    return AUTH_ERROR_MESSAGES[error];
  }
  return "Something went wrong while signing you in. Please try again.";
}
