import { z } from "zod";
import {
  formatMobileNumber,
  isValidMobileNumber,
} from "../utils/formatMobileNumber.ts";
import { isValidAmount, toCentavos } from "../utils/money.ts";

export const sendSchema = z.object({
  receiverMobileNumber: z
    .string()
    .refine(isValidMobileNumber, "Mobile number must be a valid PH number")
    .transform(formatMobileNumber),
  amount: z
    .union([z.string(), z.number()])
    .transform((val) => {
      if (typeof val === "number") {
        return String(val);
      } else {
        return val.trim();
      }
    })
    .refine(isValidAmount, "must be a positive amount")
    .transform(toCentavos)
    .refine((c) => c > 0, "must be greater than zero"),
});

export type SendInput = z.infer<typeof sendSchema>;
