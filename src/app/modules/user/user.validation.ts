import { UserRole } from "@prisma/client";
import { isValidPhoneNumber } from "libphonenumber-js";
import { z } from "zod";

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
  role: z.nativeEnum(UserRole, {
    required_error: "User role is required",
    invalid_type_error: "Invalid user role",
  }),
  phoneNumber: z.string(),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  }),
});

export const userValidation = {
  userRegisterValidationSchema,
};
