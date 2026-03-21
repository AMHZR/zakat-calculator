import { fetchLatestMetalPricesFromProviders } from "../live-pricing.js";

const ALLOWED_CURRENCIES = new Set(["AED", "USD", "SAR", "GBP", "EUR", "INR", "PKR"]);

export async function GET(request) {
  const { searchParams } = new URL(request.url, "https://zakat-calculator-universal.vercel.app");
  const currency = searchParams.get("currency") || "USD";

  if (!ALLOWED_CURRENCIES.has(currency)) {
    return new Response(
      JSON.stringify({ error: "Invalid currency. Supported: AED, USD, SAR, GBP, EUR, INR, PKR." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await fetchLatestMetalPricesFromProviders(currency);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=1800, stale-while-revalidate=3600"
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Could not load live prices.",
        detail: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
