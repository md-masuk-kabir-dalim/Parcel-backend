import { z } from "zod";
import { dateSchema } from "../bookings/bookings.validation";

const createPrescriptionZodSchema = z.object({
  patientId: z.string({ required_error: "Patient ID is required" }),
  prescriptionName: z.string(),
  date: dateSchema,
});

export type PrescriptionInput = z.infer<typeof createPrescriptionZodSchema>;
export const PrescriptionValidation = {
  createPrescriptionZodSchema,
};
