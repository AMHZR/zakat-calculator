import { convertUsdOunceToCurrencyGram } from "./live-pricing.js";
import { fetchJson } from "./utils.js";

export { convertUsdOunceToCurrencyGram };

/**
 * Fetch the latest gold and silver prices from the serverless API.
 * @param {string} [currency] - Target currency code (defaults to "USD").
 * @returns {Promise<{currency: string, goldPricePerGram: number, silverPricePerGram: number, sources: object, updatedAt: object}>}
 */
export async function fetchLatestMetalPrices(currency) {
  const targetCurrency = currency || "USD";
  return fetchJson(`/api/live-prices?currency=${encodeURIComponent(targetCurrency)}`);
}
