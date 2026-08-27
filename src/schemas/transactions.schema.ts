import { z } from "zod";
import {
  formatMobileNumber,
  isValidAmount,
  isValidMobileNumber,
  toCentavos,
} from "#utils";

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

export const historyQuerySchema = z.object({
  direction: z.enum(["inbound", "outbound"]).optional(),
  // Coerced because query params arrive as strings. Capped so a caller
  // cannot request the whole table, and bounded so NaN or a negative
  // value never reaches Postgres as `LIMIT NaN` / `OFFSET -5`.
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type HistoryQueryInput = z.infer<typeof historyQuerySchema>;
