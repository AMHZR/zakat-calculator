import { convertUsdOunceToCurrencyGram } from "./live-pricing.js";

export { convertUsdOunceToCurrencyGram };

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return response.json();
}

export async function fetchLatestMetalPrices(currency) {
  const targetCurrency = currency || "USD";
  return fetchJson(`/api/live-prices?currency=${encodeURIComponent(targetCurrency)}`);
}
