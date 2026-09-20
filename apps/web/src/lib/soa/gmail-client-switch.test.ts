import { describe, expect, test } from "bun:test";

import {
  createSoaGmailClientSlot,
  switchSoaGmailClient,
} from "./gmail-client-switch";

describe("switchSoaGmailClient", () => {
  test("applies tokens before creating the first client", async () => {
    const slot = createSoaGmailClientSlot<string>();
    const calls: string[] = [];

    const client = await switchSoaGmailClient({
      slot,
      googleAccountId: null,
      beforeSwitch: async (id) => {
        calls.push(`switch:${id ?? "default"}`);
      },
      createClient: async () => {
        calls.push("create");
        return "client-a";
      },
    });

    expect(client).toBe("client-a");
    expect(calls).toEqual(["switch:default", "create"]);
  });

  test("reuses the client for the same mailbox", async () => {
    const slot = createSoaGmailClientSlot<string>();
    let creates = 0;

    const first = await switchSoaGmailClient({
      slot,
      googleAccountId: "acct-1",
      beforeSwitch: async () => undefined,
      createClient: async () => {
        creates += 1;
        return "client-1";
      },
    });
    const second = await switchSoaGmailClient({
      slot,
      googleAccountId: "acct-1",
      beforeSwitch: async () => {
        throw new Error("should not switch again");
      },
      createClient: async () => {
        creates += 1;
        return "client-2";
      },
    });

    expect(first).toBe("client-1");
    expect(second).toBe("client-1");
    expect(creates).toBe(1);
  });

  test("switches mailbox when the account changes", async () => {
    const slot = createSoaGmailClientSlot<string>();
    const accounts: Array<string | null> = [];

    await switchSoaGmailClient({
      slot,
      googleAccountId: "acct-1",
      beforeSwitch: async (id) => {
        accounts.push(id);
      },
      createClient: async () => "client-1",
    });
    const next = await switchSoaGmailClient({
      slot,
      googleAccountId: "acct-2",
      beforeSwitch: async (id) => {
        accounts.push(id);
      },
      createClient: async () => "client-2",
    });

    expect(next).toBe("client-2");
    expect(accounts).toEqual(["acct-1", "acct-2"]);
  });
});
