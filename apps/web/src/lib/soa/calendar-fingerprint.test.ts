import { describe, expect, test } from "bun:test";

import {
  dueKeyFromPayCcFingerprint,
  eventFingerprintsAreStale,
  payCcDueKey,
  payCcFingerprint,
  seriesIsComplete,
  shiftYmd,
} from "./calendar-fingerprint";

describe("pay-cc fingerprints", () => {
  test("normalizes issuer and last 4 into the due key", () => {
    expect(payCcDueKey("BPI", "18", "2026-10-27")).toBe(
      "pay-cc:bpi:0018:2026-10-27",
    );
    expect(payCcFingerprint("bpi", "0018", "2026-10-27", 0)).toBe(
      "pay-cc:bpi:0018:2026-10-27:D-0",
    );
  });

  test("reads the due key back from a fingerprint", () => {
    expect(
      dueKeyFromPayCcFingerprint("pay-cc:rcbc:9001:2026-11-05:D-4"),
    ).toBe("pay-cc:rcbc:9001:2026-11-05");
    expect(dueKeyFromPayCcFingerprint("not-ours")).toBeNull();
  });

  test("treats a replaced due date as stale and keeps the statement date", () => {
    const keep = new Set([payCcDueKey("bpi", "0018", "2026-10-27")]);
    expect(
      eventFingerprintsAreStale(
        ["pay-cc:bpi:0018:2026-10-28:D-0"],
        keep,
      ),
    ).toBe(true);
    expect(
      eventFingerprintsAreStale(
        ["pay-cc:bpi:0018:2026-10-27:D-2"],
        keep,
      ),
    ).toBe(false);
    expect(eventFingerprintsAreStale(["flight"], keep)).toBe(false);
  });

  test("a series is complete only when D-4 through D-0 exist", () => {
    const dueKey = payCcDueKey("rcbc", "9001", "2026-11-03");
    const fps = new Set(
      [0, 1, 2, 3, 4].map((days) => `${dueKey}:D-${days}`),
    );
    expect(seriesIsComplete(dueKey, fps)).toBe(true);
    fps.delete(`${dueKey}:D-4`);
    expect(seriesIsComplete(dueKey, fps)).toBe(false);
  });

  test("shifts calendar days without a timezone jump", () => {
    expect(shiftYmd("2026-10-27", -4)).toBe("2026-10-23");
    expect(shiftYmd("2026-11-03", 2)).toBe("2026-11-05");
    expect(shiftYmd("2026-10-31", 1)).toBe("2026-11-01");
  });
});
