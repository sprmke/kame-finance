import { afterEach, describe, expect, test } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

import {
  findVendoredTesseractWasmDir,
  resolveTesseractWorkerPath,
  soaOcrMaxPagesForRuntime,
  soaOcrTimeoutMs,
  withTimeout,
} from "./tesseract-engine";

const ENV_KEYS = ["TESSERACT_WASM_DIR", "SOA_OCR_TIMEOUT_MS", "VERCEL"] as const;

const originalEnv: Record<string, string | undefined> = {};

function snapshotEnv(): void {
  for (const key of ENV_KEYS) originalEnv[key] = process.env[key];
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

snapshotEnv();
afterEach(restoreEnv);

describe("soaOcrTimeoutMs", () => {
  test("uses Vercel default when VERCEL is set and no override", () => {
    delete process.env.SOA_OCR_TIMEOUT_MS;
    process.env.VERCEL = "1";
    expect(soaOcrTimeoutMs()).toBe(45_000);
  });

  test("uses local default off Vercel", () => {
    delete process.env.SOA_OCR_TIMEOUT_MS;
    delete process.env.VERCEL;
    expect(soaOcrTimeoutMs()).toBe(90_000);
  });

  test("honors SOA_OCR_TIMEOUT_MS", () => {
    process.env.SOA_OCR_TIMEOUT_MS = "12000";
    expect(soaOcrTimeoutMs()).toBe(12_000);
  });
});

describe("soaOcrMaxPagesForRuntime", () => {
  test("keeps an explicit page cap", () => {
    expect(soaOcrMaxPagesForRuntime(2, true)).toBe(2);
    expect(soaOcrMaxPagesForRuntime(2, false)).toBe(2);
  });

  test("caps unbounded OCR on Vercel", () => {
    expect(soaOcrMaxPagesForRuntime(0, true)).toBe(3);
  });

  test("leaves unbounded OCR off Vercel", () => {
    expect(soaOcrMaxPagesForRuntime(0, false)).toBe(0);
  });
});

describe("withTimeout", () => {
  test("resolves when the work finishes in time", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 50, "late")).resolves.toBe(
      "ok",
    );
  });

  test("rejects when the work exceeds the budget", async () => {
    const hung = new Promise<string>(() => {
      /* never settles — the hang tesseract.js hits when WASM is missing */
    });
    await expect(withTimeout(hung, 20, "SOA OCR timed out after 20ms")).rejects.toThrow(
      "SOA OCR timed out after 20ms",
    );
  });
});

describe("tesseract native paths", () => {
  test("resolves the committed Node worker wrapper", () => {
    const workerPath = resolveTesseractWorkerPath();
    expect(workerPath).toBeTruthy();
    expect(workerPath).toContain("tesseract-node-worker.cjs");
  });

  test("finds vendored WASM via TESSERACT_WASM_DIR", () => {
    const dir = join(
      tmpdir(),
      `kame-tesseract-wasm-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "tesseract-core-relaxedsimd.wasm"), "fake");
    process.env.TESSERACT_WASM_DIR = dir;
    try {
      expect(findVendoredTesseractWasmDir()).toBe(dir);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
