/**
 * Copy native binaries into src/server/lib/native for Vercel file tracing.
 */
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const appRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(appRoot, "src/server/lib/native");

mkdirSync(outDir, { recursive: true });

const require = createRequire(join(appRoot, "package.json"));

const wasmSrc = require.resolve("@neslinesli93/qpdf-wasm/dist/qpdf.wasm");
const wasmDest = join(outDir, "qpdf.wasm");
copyFileSync(wasmSrc, wasmDest);
console.log(`Prepared qpdf.wasm → ${wasmDest}`);

try {
  const canvasPkgDir = dirname(
    require.resolve("@napi-rs/canvas-linux-x64-gnu/package.json"),
  );
  const nodeFile = readdirSync(canvasPkgDir).find((f) => f.endsWith(".node"));
  if (nodeFile) {
    const dest = join(outDir, "canvas.linux-x64-gnu.node");
    copyFileSync(join(canvasPkgDir, nodeFile), dest);
    console.log(`Prepared canvas.linux-x64-gnu.node → ${dest}`);
  }
} catch {
  /* optional — only present on Linux CI/Vercel builders */
}

const tessDir = join(outDir, "tesseract");
mkdirSync(tessDir, { recursive: true });

try {
  const coreDir = dirname(require.resolve("tesseract.js-core/package.json"));
  const wasmFiles = readdirSync(coreDir).filter((f) => f.endsWith(".wasm"));
  if (wasmFiles.length === 0) {
    console.warn("tesseract.js-core has no .wasm files to vendor");
  }
  for (const file of wasmFiles) {
    const dest = join(tessDir, file);
    copyFileSync(join(coreDir, file), dest);
    console.log(`Prepared ${file} → ${dest}`);
  }
} catch (err) {
  console.warn(
    "Could not vendor tesseract.js-core WASM:",
    err instanceof Error ? err.message : err,
  );
}

const TRAINEDDATA_URL =
  "https://cdn.jsdelivr.net/npm/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz";

async function prepareTraineddata(): Promise<void> {
  const dest = join(tessDir, "eng.traineddata.gz");
  try {
    const res = await fetch(TRAINEDDATA_URL);
    if (!res.ok) {
      console.warn(
        `Could not vendor eng.traineddata.gz (${res.status}); OCR will fetch from CDN at runtime.`,
      );
      return;
    }
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`Prepared eng.traineddata.gz → ${dest}`);
  } catch (err) {
    console.warn(
      "Could not vendor eng.traineddata.gz; OCR will fetch from CDN at runtime.",
      err instanceof Error ? err.message : err,
    );
  }
}

await prepareTraineddata();
