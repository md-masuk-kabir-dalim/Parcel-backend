import {
  BloodGroup,
  DoctorDesignation,
  DoctorSpecialistType,
  Gender,
  UserRole,
  WeekDay,
} from "@prisma/client";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";
import { dateSchema, timeSchema } from "../bookings/bookings.validation";
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const phoneNumberSchema = z
  .string()
  .refine((val) => !val || isValidPhoneNumber(val), {
    message: "Invalid phone number format",
  });

const userRegisterValidationSchema = z.object({
  username: z.string({
    required_error: "Username is required",
    invalid_type_error: "Username must be a string",
  }),
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Please enter a valid email address"),
  fcmToken: z.string().optional(),
  role: z.nativeEnum(UserRole, {
    required_error: "User role is required",
    invalid_type_error: "Invalid user role",
  }),
  dateOfBirth: dateSchema,
  phoneNumber: phoneNumberSchema,
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  }),
});

const DoctorCreateSchema = z.object({
  email: z.string().email(),
  phoneNumber: phoneNumberSchema,
  password: z.string().min(6),
  username: z.string().min(3),
  dateOfBirth: dateSchema,
  gender: z.nativeEnum(Gender),
  bloodGroup: z.nativeEnum(BloodGroup),
  address: z.string().min(5),
  designation: z.nativeEnum(DoctorDesignation),
  specialization: z.nativeEnum(DoctorSpecialistType),
  visitingPrice: z.number().positive(),
  experience: z.number().min(0),
  hospital: z.string().min(1),
  BMDC_No: z.string(),
  day: z.array(z.nativeEnum(WeekDay)),
  qualifications: z.string(),
  startTime: timeSchema,
  endTime: timeSchema,
});

export type doctorInput = z.infer<typeof DoctorCreateSchema>;

export const userValidation = {
  userRegisterValidationSchema,
  DoctorCreateSchema,
};
