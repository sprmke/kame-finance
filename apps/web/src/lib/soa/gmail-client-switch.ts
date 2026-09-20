export type SoaGmailClientSlot<T> = {
  client: T | null;
  accountId: string | null;
  initialized: boolean;
};

export function createSoaGmailClientSlot<T>(): SoaGmailClientSlot<T> {
  return { client: null, accountId: null, initialized: false };
}

/**
 * Load (or reuse) a Gmail client for the given mailbox.
 * Always runs `beforeSwitch` on first use so DB OAuth tokens are applied
 * before the Google client is created.
 */
export async function switchSoaGmailClient<T>(options: {
  slot: SoaGmailClientSlot<T>;
  googleAccountId: string | null;
  beforeSwitch?: (googleAccountId: string | null) => Promise<void>;
  createClient: () => Promise<T>;
}): Promise<T> {
  const nextAccountId = options.googleAccountId;
  if (
    options.slot.initialized &&
    options.slot.client &&
    nextAccountId === options.slot.accountId
  ) {
    return options.slot.client;
  }

  if (options.beforeSwitch) {
    await options.beforeSwitch(nextAccountId);
  }

  const client = await options.createClient();
  options.slot.client = client;
  options.slot.accountId = nextAccountId;
  options.slot.initialized = true;
  return client;
}
