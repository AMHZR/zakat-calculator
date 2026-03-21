import { roundCurrency } from "./utils.js";

const GOLD_NISAB_GRAMS = 85;
const SILVER_NISAB_GRAMS = 595;
const ZAKAT_RATE = 0.025;

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/**
 * Calculate zakat obligation based on the provided financial inputs.
 * @param {object} input - The financial input values for zakat calculation.
 * @param {number} [input.cash] - Cash on hand.
 * @param {number} [input.bankBalances] - Bank account balances.
 * @param {number} [input.unspentIncome] - Unspent income.
 * @param {number} [input.receivables] - Money owed to the user.
 * @param {number} [input.investments] - Investment value.
 * @param {number} [input.businessInventory] - Business inventory value.
 * @param {number} [input.otherAssets] - Other zakatable assets.
 * @param {number} [input.debtsDue] - Short-term debts owed by the user.
 * @param {number} [input.businessLiabilities] - Business liabilities.
 * @param {number} [input.goldPricePerGram] - Current gold price per gram.
 * @param {number} [input.silverPricePerGram] - Current silver price per gram.
 * @param {number} [input.goldGrams] - Grams of gold held (non-personal).
 * @param {number} [input.silverGrams] - Grams of silver held (non-personal).
 * @param {number} [input.personalGoldGrams] - Grams of personal gold jewelry.
 * @param {number} [input.personalSilverGrams] - Grams of personal silver jewelry.
 * @param {boolean} [input.includePersonalJewelry] - Whether to include personal jewelry in calculation.
 * @param {boolean} [input.hawlCompleted] - Whether a full lunar year has passed above nisab.
 * @param {string} [input.nisabBasis] - Nisab basis: "gold" or "silver".
 * @returns {{ constants: { goldNisabGrams: number, silverNisabGrams: number, zakatRate: number }, values: { goldValue: number, silverValue: number, personalGoldValue: number, personalSilverValue: number, includedJewelryValue: number, grossAssets: number, deductions: number, netZakatableAssets: number, goldNisabValue: number|null, silverNisabValue: number|null, selectedNisabValue: number|null, zakatDue: number }, status: string, statusMessage: string }}
 */
export function calculateZakat(input) {
  const cash = toNumber(input.cash);
  const bankBalances = toNumber(input.bankBalances);
  const unspentIncome = toNumber(input.unspentIncome);
  const receivables = toNumber(input.receivables);
  const investments = toNumber(input.investments);
  const businessInventory = toNumber(input.businessInventory);
  const otherAssets = toNumber(input.otherAssets);
  const debtsDue = toNumber(input.debtsDue);
  const businessLiabilities = toNumber(input.businessLiabilities);

  const goldPricePerGram = toNumber(input.goldPricePerGram);
  const silverPricePerGram = toNumber(input.silverPricePerGram);
  const goldGrams = toNumber(input.goldGrams);
  const silverGrams = toNumber(input.silverGrams);
  const personalGoldGrams = toNumber(input.personalGoldGrams);
  const personalSilverGrams = toNumber(input.personalSilverGrams);

  const includePersonalJewelry = Boolean(input.includePersonalJewelry);
  const hawlCompleted = Boolean(input.hawlCompleted);
  const nisabBasis = input.nisabBasis === "silver" ? "silver" : "gold";

  const goldValue = roundCurrency(goldGrams * goldPricePerGram);
  const silverValue = roundCurrency(silverGrams * silverPricePerGram);
  const personalGoldValue = roundCurrency(personalGoldGrams * goldPricePerGram);
  const personalSilverValue = roundCurrency(personalSilverGrams * silverPricePerGram);
  const includedJewelryValue = includePersonalJewelry
    ? roundCurrency(personalGoldValue + personalSilverValue)
    : 0;

  const grossAssets = roundCurrency(
    cash +
      bankBalances +
      unspentIncome +
      receivables +
      investments +
      businessInventory +
      otherAssets +
      goldValue +
      silverValue +
      includedJewelryValue
  );

  const deductions = roundCurrency(debtsDue + businessLiabilities);
  const netZakatableAssets = roundCurrency(Math.max(grossAssets - deductions, 0));

  const goldNisabValue = goldPricePerGram > 0
    ? roundCurrency(GOLD_NISAB_GRAMS * goldPricePerGram)
    : null;
  const silverNisabValue = silverPricePerGram > 0
    ? roundCurrency(SILVER_NISAB_GRAMS * silverPricePerGram)
    : null;
  const selectedNisabValue = nisabBasis === "gold" ? goldNisabValue : silverNisabValue;

  let status = "incomplete";
  let statusMessage = "Enter the market price for the selected nisab basis to complete the calculation.";

  if (selectedNisabValue !== null) {
    if (!hawlCompleted) {
      status = "awaiting_hawl";
      statusMessage = "Zakat is not yet due because a lunar year above nisab has not been confirmed.";
    } else if (netZakatableAssets < selectedNisabValue) {
      status = "below_nisab";
      statusMessage = "Net zakatable wealth is below the selected nisab threshold.";
    } else {
      status = "zakat_due";
      statusMessage = "Zakat is due at one quarter of one tenth (2.5%) of net zakatable wealth.";
    }
  }

  const zakatDue = status === "zakat_due"
    ? roundCurrency(netZakatableAssets * ZAKAT_RATE)
    : 0;

  return {
    constants: {
      goldNisabGrams: GOLD_NISAB_GRAMS,
      silverNisabGrams: SILVER_NISAB_GRAMS,
      zakatRate: ZAKAT_RATE
    },
    values: {
      goldValue,
      silverValue,
      personalGoldValue,
      personalSilverValue,
      includedJewelryValue,
      grossAssets,
      deductions,
      netZakatableAssets,
      goldNisabValue,
      silverNisabValue,
      selectedNisabValue,
      zakatDue
    },
    status,
    statusMessage
  };
}
