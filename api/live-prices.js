import { fetchLatestMetalPricesFromProviders } from "../live-pricing.js";

export default async function handler(request, response) {
  const { searchParams } = new URL(request.url, "https://zakat-calculator-gamma.vercel.app");
  const currency = searchParams.get("currency") || "USD";

  try {
    const payload = await fetchLatestMetalPricesFromProviders(currency);
    response.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=3600");
    response.status(200).json(payload);
  } catch (error) {
    response.status(502).json({
      error: "Could not load live prices.",
      detail: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
