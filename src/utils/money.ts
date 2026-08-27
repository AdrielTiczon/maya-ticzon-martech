const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function isValidAmount(value: string): boolean {
  return AMOUNT_PATTERN.test(value);
}

// "1000.50" -> 100050. String-based, never touches float multiplication.
export function toCentavos(value: string): number {
  const [whole, fraction = ""] = value.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

// 100050 -> "1000.50"
export function toDecimalString(centavos: number): string {
  const sign = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
