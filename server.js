import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchLatestMetalPricesFromProviders } from "./live-pricing.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const host = "127.0.0.1";
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".ico": "image/x-icon"
};

/**
 * Resolve a URL path to an absolute file path within the project root.
 * Returns null if the resolved path escapes __dirname (path traversal).
 * @param {string} urlPath
 * @returns {string | null}
 */
export function resolvePath(urlPath) {
  const requestedPath = urlPath === "/" ? "/index.html" : urlPath;
  const decodedPath = decodeURIComponent(requestedPath);
  const segments = decodedPath.split(/[\\/]+/).filter(Boolean);

  if (segments.includes("..")) {
    return null;
  }

  const normalized = normalize(decodedPath).replace(/^\/+/, "");
  return join(__dirname, normalized);
}

createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${host}:${port}`);

    if (url.pathname === "/api/live-prices") {
      try {
        const payload = await fetchLatestMetalPricesFromProviders(url.searchParams.get("currency") || "USD");
        response.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-store"
        });
        response.end(JSON.stringify(payload));
      } catch (error) {
        response.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
        response.end(JSON.stringify({
          error: "Could not load live prices.",
          detail: error instanceof Error ? error.message : "Unknown error"
        }));
      }
      return;
    }

    const filePath = resolvePath(url.pathname);
    if (filePath === null) {
      response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Forbidden");
      return;
    }
    const body = await readFile(filePath);
    const contentType = mimeTypes[extname(filePath)] || "application/octet-stream";

    response.writeHead(200, { "Content-Type": contentType });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, host, () => {
  console.log(`Zakat calculator available at http://${host}:${port}`);
});
