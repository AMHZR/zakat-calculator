import { mock, test } from "node:test";
import assert from "node:assert/strict";

// Mock node:http so importing server.js doesn't start a real HTTP server
mock.module("node:http", {
  namedExports: {
    createServer: () => ({ listen: () => {} })
  }
});

// Mock live-pricing.js since it's imported by server.js but not needed here
mock.module("./live-pricing.js", {
  namedExports: {
    fetchLatestMetalPricesFromProviders: async () => ({})
  }
});

const { resolvePath } = await import("./server.js");

// --- Requirement 9.1: Traversal paths return null (triggers 403 in the server) ---

test("resolvePath returns null for /../etc/passwd", () => {
  assert.equal(resolvePath("/../etc/passwd"), null);
});

test("resolvePath returns null for /../../etc/passwd", () => {
  assert.equal(resolvePath("/../../etc/passwd"), null);
});

test("resolvePath returns null for /../../../etc/passwd", () => {
  assert.equal(resolvePath("/../../../etc/passwd"), null);
});

// --- Requirement 9.2: Normal paths resolve within the project root ---

test("resolvePath resolves /app.js to a path ending with /app.js", () => {
  const result = resolvePath("/app.js");
  assert.notEqual(result, null);
  assert.ok(result.endsWith("/app.js"), `Expected path ending with /app.js, got: ${result}`);
});

test("resolvePath resolves / to a path ending with /index.html", () => {
  const result = resolvePath("/");
  assert.notEqual(result, null);
  assert.ok(result.endsWith("/index.html"), `Expected path ending with /index.html, got: ${result}`);
});
