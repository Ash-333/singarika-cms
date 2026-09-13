/** All prices are stored as integer paise. These helpers convert at the edges. */

export function rupeesToPaise(rupees: number | string) {
  const n = typeof rupees === "string" ? Number(rupees) : rupees;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function paiseToRupees(paise: number) {
  return paise / 100;
}

export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}
