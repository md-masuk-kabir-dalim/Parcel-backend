import { z } from "zod";
import { ReportStatus } from "@prisma/client";

const baseFields = {
  patientId: z.string().uuid(),
  doctorId: z.string().uuid(),
  amount: z.number().optional(),
  testReport: z.array(z.string()).optional(),
};

const ReportCreateSchema = z.object({
  ...baseFields,
});

export type reportInput = z.infer<typeof ReportCreateSchema>;

export const ReportValidation = {
  ReportCreateSchema,
};
