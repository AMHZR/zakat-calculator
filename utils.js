/**
 * Round a number to two decimal places using banker-safe epsilon adjustment.
 * @param {number} value
 * @returns {number}
 */
export function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Fetch JSON from a URL, throwing on non-OK responses.
 * @param {string} url
 * @returns {Promise<any>}
 */
export async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return response.json();
}
