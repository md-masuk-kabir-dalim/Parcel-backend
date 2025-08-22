import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const dateSchema = z
  .string()
  .refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format (expected ISO 8601 string)",
  })
  .transform((val) => new Date(val));

export const timeSchema = z
  .string()
  .regex(timeRegex, "Invalid start time (HH:MM 24-hour format)");

const DoctorBookingSchema = z.object({
  doctorId: z.string().uuid("Invalid doctorId format"),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
});

export type BookingInput = z.infer<typeof DoctorBookingSchema>;

export const DoctorBookingValidation = {
  DoctorBookingSchema,
};
