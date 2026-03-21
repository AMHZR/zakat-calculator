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

// --- Task 10.1: Silver nisab, deductions, incomplete status, edge inputs ---

test("silver nisab basis produces correct silverNisabValue and zakat_due status", () => {
  const result = calculateZakat({
    cash: 10000,
    goldPricePerGram: 400,
    silverPricePerGram: 5,
    nisabBasis: "silver",
    hawlCompleted: true
  });

  // Silver nisab = 595 * 5 = 2975
  assert.equal(result.values.silverNisabValue, 2975);
  assert.equal(result.values.selectedNisabValue, 2975);
  assert.equal(result.status, "zakat_due");
  assert.equal(result.values.zakatDue, 250); // 10000 * 0.025
});

test("deductions reduce netZakatableAssets and affect zakatDue", () => {
  const result = calculateZakat({
    cash: 50000,
    debtsDue: 5000,
    businessLiabilities: 3000,
    goldPricePerGram: 400,
    silverPricePerGram: 4,
    nisabBasis: "gold",
    hawlCompleted: true
  });

  assert.equal(result.values.deductions, 8000);
  assert.equal(result.values.netZakatableAssets, 42000);
  assert.equal(result.values.zakatDue, 1050); // 42000 * 0.025
});

test("returns incomplete status when both gold and silver prices are 0", () => {
  const result = calculateZakat({
    cash: 50000,
    goldPricePerGram: 0,
    silverPricePerGram: 0,
    nisabBasis: "gold",
    hawlCompleted: true
  });

  assert.equal(result.status, "incomplete");
  assert.equal(result.values.goldNisabValue, null);
  assert.equal(result.values.silverNisabValue, null);
  assert.equal(result.values.selectedNisabValue, null);
  assert.equal(result.values.zakatDue, 0);
});

test("returns incomplete status for silver basis when silverPricePerGram is 0", () => {
  const result = calculateZakat({
    cash: 50000,
    goldPricePerGram: 400,
    silverPricePerGram: 0,
    nisabBasis: "silver",
    hawlCompleted: true
  });

  assert.equal(result.status, "incomplete");
  assert.equal(result.values.selectedNisabValue, null);
  assert.equal(result.values.zakatDue, 0);
});

test("zero-value inputs return sensible defaults", () => {
  const result = calculateZakat({
    cash: 0,
    bankBalances: 0,
    goldPricePerGram: 0,
    silverPricePerGram: 0,
    nisabBasis: "gold",
    hawlCompleted: true
  });

  assert.equal(result.values.grossAssets, 0);
  assert.equal(result.values.deductions, 0);
  assert.equal(result.values.netZakatableAssets, 0);
  assert.equal(result.values.zakatDue, 0);
  assert.equal(result.status, "incomplete");
});

test("negative-value inputs are treated as 0 by toNumber()", () => {
  const result = calculateZakat({
    cash: -5000,
    bankBalances: -100,
    debtsDue: -2000,
    goldPricePerGram: 400,
    silverPricePerGram: 4,
    nisabBasis: "gold",
    hawlCompleted: true
  });

  // All negative values become 0 via toNumber()
  assert.equal(result.values.grossAssets, 0);
  assert.equal(result.values.deductions, 0);
  assert.equal(result.values.netZakatableAssets, 0);
  assert.equal(result.status, "below_nisab");
  assert.equal(result.values.zakatDue, 0);
});
