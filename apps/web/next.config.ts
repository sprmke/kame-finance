import path from "path";
import type { NextConfig } from "next";

import { LEGACY_DASHBOARD_REDIRECTS } from "./src/config/routes";

const repoRoot = path.join(__dirname, "../..");

/** Vendored native files only — do not trace node_modules (Bun .bun symlinks break Vercel). */
const nativeTraceGlobs = [
  "./src/server/lib/native/qpdf.wasm",
  "./src/server/lib/native/canvas.linux-x64-gnu.node",
  "./src/server/lib/tesseract-node-worker.cjs",
  "./src/server/lib/native/tesseract/**",
];

const traceExcludeGlobs = ["**/node_modules/.bun/**"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 307s (not permanent) so moved routes stay reversible; queries pass through.
  async redirects() {
    return [
      {
        source: "/dashboard/integrations",
        destination: "/dashboard/settings?section=connections",
        permanent: true,
      },
      ...LEGACY_DASHBOARD_REDIRECTS.map((rule) => ({
        source: rule.source,
        destination: rule.destination,
        permanent: false,
      })),
    ];
  },
  typedRoutes: true,
  outputFileTracingRoot: repoRoot,
  serverExternalPackages: [
    "@napi-rs/canvas",
    "pdfjs-dist",
    "pdfkit",
    "tesseract.js",
    "tesseract.js-core",
    "@neslinesli93/qpdf-wasm",
  ],
  outputFileTracingIncludes: {
    "/api/trpc/[trpc]": nativeTraceGlobs,
    "/api/soa/pdf": nativeTraceGlobs,
    "/api/health/engines": nativeTraceGlobs,
  },
  outputFileTracingExcludes: {
    "/api/trpc/[trpc]": traceExcludeGlobs,
    "/api/soa/pdf": traceExcludeGlobs,
    "/api/health/engines": traceExcludeGlobs,
  },
  experimental: {
    serverActions: { bodySizeLimit: "15mb" },
    // Barrel-file packages pull in far more modules than each page uses.
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@tanstack/react-query",
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
      config.externals = [
        ...(Array.isArray(config.externals)
          ? config.externals
          : [config.externals]),
        "@neslinesli93/qpdf-wasm",
      ];
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/api/soa/pdf",
        headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }],
      },
      {
        source: "/((?!api/soa/pdf).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
