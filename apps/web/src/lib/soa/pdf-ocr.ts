// @ts-nocheck
import "./pdf-node-polyfill";
import { createWorker, PSM } from "tesseract.js";

import { rasterizePdfPages } from "@/server/lib/pdf-rasterize";
import {
  assertTesseractCoreAvailable,
  findVendoredTesseractWasmDir,
  resolveTesseractLangPath,
  resolveTesseractWorkerPath,
  soaOcrMaxPagesForRuntime,
  soaOcrTimeoutMs,
  tesseractCacheDir,
  tesseractNeedsWasmRedirect,
  withTimeout,
} from "@/server/lib/tesseract-engine";

/**
 * OCR fallback for any bank's SOA PDF — rasterize pages (pdf.js + canvas) then run
 * Tesseract. Bank-agnostic: `run.ts` decides *when* to call this based on extracted
 * text quality (see `text-quality.ts`), not on which issuer the PDF came from.
 */
export type SoaOcrOptions = {
  /** Max pages to OCR; `0` = entire PDF. */
  maxPages: number;
  /** Render scale for rasterization (higher = sharper, slower). */
  scale: number;
  /** Tesseract page segmentation mode (string "0"–"13"). */
  psm: PSM;
  /** Append a second pass with sparse layout (helps when labels are scattered). */
  dualSparse: boolean;
};

const PSM_VALUES = new Set<string>(Object.values(PSM));

export function parseSoaOcrPsmEnv(raw: string | undefined): PSM {
  const t = raw?.trim() ?? "";
  if (t && PSM_VALUES.has(t)) return t as PSM;
  return PSM.AUTO;
}

/** Fixes common OCR quirks before regex parsing (spaced-out currency codes, thousands separators). */
function normalizeSoaOcrChunk(s: string): string {
  return s
    .replace(/\uFF1A/g, ":")
    .replace(/P\s+H\s+P/gi, "PHP")
    .replace(/(\d),\s+(\d{3})/g, "$1,$2");
}

async function recognizeWithPsm(
  worker: Awaited<ReturnType<typeof createWorker>>,
  pageBuf: Buffer,
  psm: PSM,
): Promise<string> {
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: "1",
  });
  const { data } = await worker.recognize(pageBuf);
  return normalizeSoaOcrChunk(data.text?.trim() ?? "");
}

async function createSoaOcrWorker() {
  assertTesseractCoreAvailable();

  const workerOptions: {
    cachePath: string;
    gzip: boolean;
    errorHandler: (err: unknown) => void;
    workerPath?: string;
    langPath?: string;
  } = {
    cachePath: tesseractCacheDir(),
    gzip: true,
    errorHandler: (err: unknown) => {
      console.warn("[soa-ocr] tesseract worker:", err);
    },
  };

  if (tesseractNeedsWasmRedirect()) {
    const workerPath = resolveTesseractWorkerPath();
    const wasmDir = findVendoredTesseractWasmDir();
    if (!workerPath || !wasmDir) {
      throw new Error(
        "Tesseract WASM is vendored but the Node worker wrapper is missing from the serverless bundle.",
      );
    }
    process.env.TESSERACT_WASM_DIR = wasmDir;
    workerOptions.workerPath = workerPath;
  }

  const langPath = resolveTesseractLangPath();
  if (langPath) workerOptions.langPath = langPath;

  return createWorker("eng", 1, workerOptions);
}

/**
 * Rasterize PDF pages to bitmaps (pdf.js + canvas), then Tesseract.
 * For higher quality on disk, use Apple Preview / ocrmypdf and parse manually — see docs/SETUP.md.
 */
export async function ocrPdfToPlainText(
  pdfPath: string,
  password: string,
  options: SoaOcrOptions,
): Promise<string> {
  const timeoutMs = soaOcrTimeoutMs();
  const maxPages = soaOcrMaxPagesForRuntime(options.maxPages);
  const { scale, psm, dualSparse } = options;

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

  const run = async () => {
    worker = await createSoaOcrWorker();
    const parts: string[] = [];
    for await (const pageBuf of rasterizePdfPages(
      pdfPath,
      password,
      scale,
      maxPages,
    )) {
      let chunk = await recognizeWithPsm(worker, pageBuf, psm);
      if (dualSparse && psm !== PSM.SPARSE_TEXT) {
        const sparse = await recognizeWithPsm(worker, pageBuf, PSM.SPARSE_TEXT);
        if (sparse) chunk = chunk ? `${chunk}\n${sparse}` : sparse;
      }
      if (chunk) parts.push(chunk);
    }
    return parts.join("\n\n");
  };

  try {
    return await withTimeout(
      run(),
      timeoutMs,
      `SOA OCR timed out after ${timeoutMs}ms`,
    );
  } finally {
    if (worker) {
      await worker.terminate().catch(() => {
        /* already dead */
      });
    }
  }
}
