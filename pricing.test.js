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
