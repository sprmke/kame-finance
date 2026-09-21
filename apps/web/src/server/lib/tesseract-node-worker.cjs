"use strict";

/**
 * Tesseract.js Node worker with WASM path redirect.
 *
 * On Vercel the JS glue in `tesseract.js-core` is traced, but the sibling
 * `.wasm` binaries are not. `prepare-server-native` copies those binaries into
 * `src/server/lib/native/tesseract/`; this worker reads them from
 * `TESSERACT_WASM_DIR` instead of `/var/task/node_modules/tesseract.js-core/`.
 *
 * Must stay CommonJS — `worker_threads` loads this file by path.
 */
const fs = require("fs");
const path = require("path");

const wasmDir = process.env.TESSERACT_WASM_DIR?.trim();

if (wasmDir) {
  const origReadFileSync = fs.readFileSync.bind(fs);
  const origExistsSync = fs.existsSync.bind(fs);
  const origAccessSync = fs.accessSync.bind(fs);
  const origPromisesReadFile = fs.promises.readFile.bind(fs.promises);

  const redirect = (filePath) => {
    if (typeof filePath !== "string" || !filePath.endsWith(".wasm")) {
      return filePath;
    }
    const base = path.basename(filePath);
    if (!base.startsWith("tesseract-core")) return filePath;
    const redirected = path.join(wasmDir, base);
    try {
      origAccessSync(redirected, fs.constants.R_OK);
      return redirected;
    } catch {
      return filePath;
    }
  };

  fs.readFileSync = (filePath, ...args) => origReadFileSync(redirect(filePath), ...args);
  fs.existsSync = (filePath) => origExistsSync(redirect(filePath));
  fs.accessSync = (filePath, ...args) => origAccessSync(redirect(filePath), ...args);
  fs.promises.readFile = (filePath, ...args) =>
    origPromisesReadFile(redirect(filePath), ...args);
}

require("tesseract.js/src/worker-script/node/index.js");
