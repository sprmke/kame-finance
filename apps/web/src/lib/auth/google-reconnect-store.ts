import { isGoogleReconnectRequiredError } from "@/lib/auth/google-reconnect";

type GoogleReconnectSnapshot = {
  open: boolean;
  message: string | null;
};

type Listener = () => void;

const CLOSED_SNAPSHOT: GoogleReconnectSnapshot = { open: false, message: null };

let snapshot: GoogleReconnectSnapshot = CLOSED_SNAPSHOT;
let dismissed = false;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeGoogleReconnect(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getGoogleReconnectSnapshot(): GoogleReconnectSnapshot {
  return snapshot;
}

/** Stable snapshot for useSyncExternalStore SSR — must not allocate per call. */
export function getGoogleReconnectServerSnapshot(): GoogleReconnectSnapshot {
  return CLOSED_SNAPSHOT;
}

export function openGoogleReconnectModal(
  message?: string | null,
  options?: { force?: boolean },
): void {
  if (dismissed && !options?.force) return;
  if (options?.force) dismissed = false;
  snapshot = {
    open: true,
    message: message?.trim() || null,
  };
  emit();
}

export function closeGoogleReconnectModal(): void {
  if (!snapshot.open && !snapshot.message) return;
  snapshot = CLOSED_SNAPSHOT;
  emit();
}

/** Hide the prompt until the next failed action or a healthy auth check. */
export function dismissGoogleReconnectModal(): void {
  dismissed = true;
  closeGoogleReconnectModal();
}

/** Clear a dismissal once Gmail is healthy again. */
export function acknowledgeGoogleReconnect(): void {
  dismissed = false;
  closeGoogleReconnectModal();
}

export function notifyGoogleReconnectRequired(error: unknown): void {
  if (!isGoogleReconnectRequiredError(error)) return;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : null;
  openGoogleReconnectModal(message, { force: true });
}
