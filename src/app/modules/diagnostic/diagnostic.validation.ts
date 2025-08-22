import { z } from "zod";
import { phoneNumberSchema } from "../user/user.validation";
import { dateSchema } from "../bookings/bookings.validation";

const DiagnosticCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: phoneNumberSchema,
  ownerName: z.string().min(1, "Owner name is required"),
  email: z.string().email(),
  tradeLicense: z.string().min(1, "Trade license is required"),
  dateOfBirth: dateSchema,
  type: z.string().min(1, "Type is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  address: z.string(),
});

const DiagnosticLoginSchema = z.object({
  diagnosticID: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export type DiagnosticInput = z.infer<typeof DiagnosticCreateSchema>;
export type diagnosticLoginInput = z.infer<typeof DiagnosticLoginSchema>;
export const DiagnosticValidation = {
  DiagnosticCreateSchema,
  DiagnosticLoginSchema,
};
