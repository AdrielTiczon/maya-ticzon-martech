import { badRequest } from "./errors.ts";

const PH_MOBILE = /^(?:\+63|63|0)?(9\d{9})$/;

export function formatMobileNumber(input: string): string {
  const match = PH_MOBILE.exec(input.replace(/[\s()-]/g, ""));
  if (!match) {
    throw badRequest(
      "INVALID_MOBILE_NUMBER",
      "Must be a valid PH mobile number.",
    );
  }
  return `63${match[1]}`; // 639171234567
}

export function isValidMobileNumber(input: string): boolean {
  return PH_MOBILE.test(input.replace(/[\s()-]/g, ""));
}
