import test from "node:test";
import assert from "node:assert/strict";

import { calculateZakat } from "./calculator.js";

test("calculates zakat when net wealth is above gold nisab and hawl is complete", () => {
  const result = calculateZakat({
    cash: 50000,
    goldPricePerGram: 400,
    silverPricePerGram: 4,
    nisabBasis: "gold",
    hawlCompleted: true
  });

  assert.equal(result.status, "zakat_due");
  assert.equal(result.values.selectedNisabValue, 34000);
  assert.equal(result.values.zakatDue, 1250);
});

test("returns zero when wealth is below the selected nisab", () => {
  const result = calculateZakat({
    cash: 2000,
    goldPricePerGram: 400,
    silverPricePerGram: 4,
    nisabBasis: "gold",
    hawlCompleted: true
  });

  assert.equal(result.status, "below_nisab");
  assert.equal(result.values.zakatDue, 0);
});

test("returns zero when hawl has not completed", () => {
  const result = calculateZakat({
    cash: 75000,
    goldPricePerGram: 400,
    silverPricePerGram: 4,
    nisabBasis: "gold",
    hawlCompleted: false
  });

  assert.equal(result.status, "awaiting_hawl");
  assert.equal(result.values.zakatDue, 0);
});

test("includes personal jewelry only when the user opts in", () => {
  const withoutJewelry = calculateZakat({
    cash: 32000,
    personalGoldGrams: 10,
    goldPricePerGram: 400,
    silverPricePerGram: 4,
    nisabBasis: "gold",
    hawlCompleted: true,
    includePersonalJewelry: false
  });

  const withJewelry = calculateZakat({
    cash: 32000,
    personalGoldGrams: 10,
    goldPricePerGram: 400,
    silverPricePerGram: 4,
    nisabBasis: "gold",
    hawlCompleted: true,
    includePersonalJewelry: true
  });

  assert.equal(withoutJewelry.status, "below_nisab");
  assert.equal(withJewelry.status, "zakat_due");
  assert.equal(withJewelry.values.zakatDue, 900);
});
