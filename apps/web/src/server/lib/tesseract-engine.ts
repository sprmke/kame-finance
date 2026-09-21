import { createRequire } from "node:module";
import { accessSync, constants, mkdirSync, readdirSync } from "fs";
import { tmpdir } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const NATIVE_RELATIVE = "src/server/lib/native";
const TESSERACT_DIR_NAME = "tesseract";
const WORKER_FILE = "tesseract-node-worker.cjs";
const CACHE_DIR = join(tmpdir(), "tesseract-cache");

const ENGINE_DIR = dirname(fileURLToPath(import.meta.url));

const PATH_CANDIDATE_ROOTS = [
  ENGINE_DIR,
  join(ENGINE_DIR, "native"),
  join(process.cwd(), "src/server/lib"),
  join(process.cwd(), "apps/web/src/server/lib"),
  join(process.cwd(), NATIVE_RELATIVE),
  join(process.cwd(), "apps/web", NATIVE_RELATIVE),
];

function isReadable(path: string): boolean {
  try {
    accessSync(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function listWasmFiles(dir: string): string[] {
  try {
    return readdirSync(dir).filter(
      (name) => name.startsWith("tesseract-core") && name.endsWith(".wasm"),
    );
  } catch {
    return [];
  }
}

function nodeModulesCoreDir(): string | null {
  const packageJsonCandidates = [
    join(process.cwd(), "package.json"),
    join(process.cwd(), "apps/web/package.json"),
  ];
  for (const pkg of packageJsonCandidates) {
    try {
      const req = createRequire(pkg);
      return dirname(req.resolve("tesseract.js-core/package.json"));
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Directory of vendored `tesseract-core*.wasm` files, or null. */
export function findVendoredTesseractWasmDir(): string | null {
  const override = process.env.TESSERACT_WASM_DIR?.trim();
  if (override && listWasmFiles(override).length > 0) return override;

  const dirs = [
    join(ENGINE_DIR, "native", TESSERACT_DIR_NAME),
    join(process.cwd(), NATIVE_RELATIVE, TESSERACT_DIR_NAME),
    join(process.cwd(), "apps/web", NATIVE_RELATIVE, TESSERACT_DIR_NAME),
  ];
  for (const dir of dirs) {
    if (listWasmFiles(dir).length > 0) return dir;
  }
  return null;
}

/** `tesseract.js-core` install with WASM on disk, or null (typical on Vercel). */
export function findNodeModulesTesseractWasmDir(): string | null {
  const dir = nodeModulesCoreDir();
  if (dir && listWasmFiles(dir).length > 0) return dir;
  return null;
}

export function resolveTesseractWorkerPath(): string | null {
  const names = [WORKER_FILE, join("native", WORKER_FILE)];
  for (const root of PATH_CANDIDATE_ROOTS) {
    for (const name of names) {
      const candidate = join(root, name);
      if (isReadable(candidate)) return candidate;
    }
  }
  return null;
}

export function resolveTesseractLangPath(): string | null {
  const dirs = [
    findVendoredTesseractWasmDir(),
    findNodeModulesTesseractWasmDir(),
  ].filter((dir): dir is string => Boolean(dir));

  for (const dir of dirs) {
    if (
      isReadable(join(dir, "eng.traineddata.gz")) ||
      isReadable(join(dir, "eng.traineddata"))
    ) {
      return dir;
    }
  }
  return null;
}

export function tesseractCacheDir(): string {
  mkdirSync(CACHE_DIR, { recursive: true });
  return CACHE_DIR;
}

/**
 * Throws before `createWorker()` when no WASM binary can be opened.
 * That abort used to hang the SOA run (tesseract.js swallows load errors).
 */
export function assertTesseractCoreAvailable(): void {
  if (findNodeModulesTesseractWasmDir() || findVendoredTesseractWasmDir()) {
    return;
  }
  throw new Error(
    "Tesseract WASM not available on this server. Run `bun run prepare-server-native` before deploy.",
  );
}

/** Prefer vendored WASM even when `node_modules` has a partial copy. */
export function tesseractNeedsWasmRedirect(): boolean {
  return Boolean(findVendoredTesseractWasmDir());
}

/** Per-PDF OCR budget. Unbounded Tesseract on Vercel stalls `getRunProgress` until the function dies. */
export function soaOcrTimeoutMs(): number {
  const raw = process.env.SOA_OCR_TIMEOUT_MS?.trim();
  if (raw) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.min(240_000, Math.max(5_000, parsed));
    }
  }
  return process.env.VERCEL ? 45_000 : 90_000;
}

/**
 * Serverless rasterize+OCR of a full statement can exceed the function budget.
 * Explicit `SOA_OCR_PAGES` still wins (`maxPages > 0`).
 */
export function soaOcrMaxPagesForRuntime(
  maxPages: number,
  vercel = Boolean(process.env.VERCEL),
): number {
  if (maxPages > 0) return maxPages;
  return vercel ? 3 : 0;
}

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
