import { mock, test } from "node:test";
import assert from "node:assert/strict";

// Mock the live-pricing module before importing the handler
const mockFetchPrices = mock.fn();
mock.module("../live-pricing.js", {
  namedExports: {
    fetchLatestMetalPricesFromProviders: mockFetchPrices
  }
});

const { GET } = await import("./live-prices.js");

/** Helper: build a Request with an optional currency query param. */
function makeRequest(currency) {
  const url = currency != null
    ? `https://example.com/api/live-prices?currency=${currency}`
    : "https://example.com/api/live-prices";
  return new Request(url);
}

const SAMPLE_PAYLOAD = {
  currency: "USD",
  goldPricePerGram: 95.12,
  silverPricePerGram: 1.05,
  sources: { metals: "Gold API", fx: "Open ER API" },
  updatedAt: { gold: null, silver: null, fx: null }
};

test("returns 400 for an invalid currency parameter", async () => {
  const res = await GET(makeRequest("XYZ"));

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error);
  assert.match(body.error, /Invalid currency/i);
});

test("returns 200 with valid JSON for a valid currency", async () => {
  mockFetchPrices.mock.mockImplementation(async () => SAMPLE_PAYLOAD);

  const res = await GET(makeRequest("EUR"));

  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Content-Type"), "application/json");

  const body = await res.json();
  assert.equal(body.goldPricePerGram, SAMPLE_PAYLOAD.goldPricePerGram);
  assert.equal(body.silverPricePerGram, SAMPLE_PAYLOAD.silverPricePerGram);
});

test("defaults to USD when no currency param is provided", async () => {
  let receivedCurrency;
  mockFetchPrices.mock.mockImplementation(async (cur) => {
    receivedCurrency = cur;
    return SAMPLE_PAYLOAD;
  });

  const res = await GET(makeRequest(null));

  assert.equal(res.status, 200);
  assert.equal(receivedCurrency, "USD");
});

test("returns 502 when upstream throws", async () => {
  mockFetchPrices.mock.mockImplementation(async () => {
    throw new Error("upstream timeout");
  });

  const res = await GET(makeRequest("USD"));

  assert.equal(res.status, 502);
  const body = await res.json();
  assert.ok(body.error);
  assert.match(body.detail, /upstream timeout/);
});
