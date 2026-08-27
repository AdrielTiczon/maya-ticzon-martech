import { z } from "zod";
import { formatMobileNumber, isValidMobileNumber } from "#utils";

export const loginSchema = z.object({
  mobileNumber: z
    .string()
    .refine(isValidMobileNumber, "must be a valid PH mobile number")
    .transform(formatMobileNumber), // -> 639XXXXXXXXX
  mpin: z.string().regex(/^\d{4,6}$/, "must be 4 to 6 digits"),
});

export type LoginInput = z.infer<typeof loginSchema>;
