/**
 * All prices are stored as integer paisa (1 Nepali rupee = 100 paisa).
 * These helpers convert at the edges — forms and the public API speak rupees.
 */

export function rupeesToPaisa(rupees: number | string) {
  const n = typeof rupees === "string" ? Number(rupees) : rupees;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function paisaToRupees(paisa: number) {
  return paisa / 100;
}

/**
 * Nepali rupees, grouped the South Asian way (12,49,900 → रु 12,49,900).
 * `Intl` has no NPR symbol on most runtimes, so the mark is prefixed by hand.
 */
export function formatNPR(paisa: number) {
  const rupees = paisa / 100;
  const grouped = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
  return `रु ${grouped}`;
}
