/**
 * @license
 * GreenPulse AI — Core Utility Helpers
 */

/**
 * Merges classnames cleanly
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formats numbers into JetBrains Mono tabular string representation
 */
export function formatMetricNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Formats currency values in INR or USD
 */
export function formatCurrency(amount: number, symbol: string = '₹'): string {
  if (amount >= 10000000) {
    return `${symbol}${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `${symbol}${(amount / 100000).toFixed(2)} L`;
  }
  return `${symbol}${new Intl.NumberFormat('en-IN').format(Math.round(amount))}`;
}

/**
 * Formats CO2e quantities nicely (kg vs Tonnes)
 */
export function formatCo2e(quantityKg: number): string {
  if (quantityKg >= 1000) {
    return `${(quantityKg / 1000).toFixed(1)} tCO₂e`;
  }
  return `${Math.round(quantityKg)} kgCO₂e`;
}
