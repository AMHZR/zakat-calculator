import { roundCurrency, fetchJson } from "./utils.js";

const TROY_OUNCE_IN_GRAMS = 31.1034768;

function ensureFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new Error(`Missing or invalid ${label}.`);
  }

  return value;
}

async function fetchUsdRate(targetCurrency) {
  if (targetCurrency === "USD") {
    return {
      rate: 1,
      updatedAt: null,
      sourceName: "Open ER API"
    };
  }

  const data = await fetchJson("https://open.er-api.com/v6/latest/USD");

  if (data.result !== "success") {
    throw new Error("FX provider returned an unsuccessful response.");
  }

  const rate = data.rates?.[targetCurrency];

  if (!Number.isFinite(rate)) {
    throw new Error(`FX rate for ${targetCurrency} is unavailable.`);
  }

  return {
    rate,
    updatedAt: data.time_last_update_utc || null,
    sourceName: "Open ER API"
  };
}

/**
 * Convert a USD-per-troy-ounce price to a target-currency-per-gram price.
 * @param {number} pricePerOunceUsd - Metal price in USD per troy ounce.
 * @param {number} [usdToCurrencyRate=1] - Exchange rate from USD to target currency.
 * @returns {number} Price per gram in the target currency, rounded to two decimals.
 */
export function convertUsdOunceToCurrencyGram(pricePerOunceUsd, usdToCurrencyRate = 1) {
  const ouncePrice = ensureFiniteNumber(Number(pricePerOunceUsd), "USD ounce price");
  const exchangeRate = ensureFiniteNumber(Number(usdToCurrencyRate), "exchange rate");

  return roundCurrency((ouncePrice * exchangeRate) / TROY_OUNCE_IN_GRAMS);
}

/**
 * Fetch latest gold and silver prices from external providers and convert to the target currency per gram.
 * @param {string} [currency] - ISO 4217 currency code (defaults to "USD").
 * @returns {Promise<{currency: string, goldPricePerGram: number, silverPricePerGram: number, sources: {metals: string, fx: string}, updatedAt: {gold: string|null, silver: string|null, fx: string|null}}>}
 */
export async function fetchLatestMetalPricesFromProviders(currency) {
  const targetCurrency = currency || "USD";
  const [gold, silver, fx] = await Promise.all([
    fetchJson("https://api.gold-api.com/price/XAU"),
    fetchJson("https://api.gold-api.com/price/XAG"),
    fetchUsdRate(targetCurrency)
  ]);

  return {
    currency: targetCurrency,
    goldPricePerGram: convertUsdOunceToCurrencyGram(gold.price, fx.rate),
    silverPricePerGram: convertUsdOunceToCurrencyGram(silver.price, fx.rate),
    sources: {
      metals: "Gold API",
      fx: fx.sourceName
    },
    updatedAt: {
      gold: gold.updatedAt || null,
      silver: silver.updatedAt || null,
      fx: fx.updatedAt
    }
  };
}
