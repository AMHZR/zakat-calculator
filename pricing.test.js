import test from "node:test";
import assert from "node:assert/strict";

import { convertUsdOunceToCurrencyGram } from "./pricing.js";

test("converts USD per ounce into USD per gram", () => {
  const price = convertUsdOunceToCurrencyGram(3100, 1);

  assert.equal(price, 99.67);
});

test("converts USD per ounce into target currency per gram", () => {
  const price = convertUsdOunceToCurrencyGram(3100, 3.6725);

  assert.equal(price, 366.03);
});

test("throws for NaN as pricePerOunceUsd", () => {
  assert.throws(() => convertUsdOunceToCurrencyGram(NaN, 1), { message: /Missing or invalid/ });
});

test("throws for Infinity as pricePerOunceUsd", () => {
  assert.throws(() => convertUsdOunceToCurrencyGram(Infinity, 1), { message: /Missing or invalid/ });
});

test("throws for -Infinity as pricePerOunceUsd", () => {
  assert.throws(() => convertUsdOunceToCurrencyGram(-Infinity, 1), { message: /Missing or invalid/ });
});

test("throws for non-numeric string as pricePerOunceUsd", () => {
  assert.throws(() => convertUsdOunceToCurrencyGram("abc", 1), { message: /Missing or invalid/ });
});

test("throws for NaN as usdToCurrencyRate", () => {
  assert.throws(() => convertUsdOunceToCurrencyGram(3100, NaN), { message: /Missing or invalid/ });
});

test("throws for Infinity as usdToCurrencyRate", () => {
  assert.throws(() => convertUsdOunceToCurrencyGram(3100, Infinity), { message: /Missing or invalid/ });
});

test("throws for -Infinity as usdToCurrencyRate", () => {
  assert.throws(() => convertUsdOunceToCurrencyGram(3100, -Infinity), { message: /Missing or invalid/ });
});

test("throws for non-numeric string as usdToCurrencyRate", () => {
  assert.throws(() => convertUsdOunceToCurrencyGram(3100, "xyz"), { message: /Missing or invalid/ });
});
