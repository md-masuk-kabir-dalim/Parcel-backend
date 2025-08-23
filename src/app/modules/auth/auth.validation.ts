import { OtpType } from "@prisma/client";
import { z } from "zod";
import { phoneNumberSchema } from "../user/user.validation";

export const locationSchema = z.object({
  type: z.literal("Point"),
  address: z.string({ required_error: "Address is required" }),
  coordinates: z
    .array(z.number())
    .length(2, { message: "Coordinates must be [longitude, latitude]" }),
});

const authLoginSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Please enter a valid email address"),
  password: z.string({
    required_error: "Password is required",
    invalid_type_error: "Password must be a string",
  }),
});


const sendOtpSchema = z.object({
  identify: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string",
    })
    .email("Please enter a valid email address"),
  otpType: z.enum([OtpType.EMAIL_VERIFICATION,OtpType.PHONE_VERIFICATION, OtpType.PASSWORD_RESET], {
    required_error: "OTP type is required",
    invalid_type_error:
      "OTP type must be either 'VERIFICATION' or 'PASSWORD_RESET'",
  }),
});



export const authValidation = {
  authLoginSchema,
  sendOtpSchema,
};
