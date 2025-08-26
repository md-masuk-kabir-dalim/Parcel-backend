import { PARCEL_TYPE, PAYMENT_MODE, SIZE_CATEGORY } from "@prisma/client";
import { z } from "zod";
export const locationSchema = z.object({
  type: z.literal("Point"),
  address: z.string().min(1, "Address is required"),
  coordinates: z
    .tuple([
      z.number().refine((val) => !isNaN(Number(val)), {
        message: "Longitude must be a number string",
      }),
      z.number().refine((val) => !isNaN(Number(val)), {
        message: "Latitude must be a number string",
      }),
    ])
    .refine(
      ([lng, lat]) => {
        const lon = Number(lng);
        const latitude = Number(lat);
        return lon >= -180 && lon <= 180 && latitude >= -90 && latitude <= 90;
      },
      {
        message: "Coordinates are out of range",
      }
    ),
});

export const parcelSchema = z.object({
  pickupLocation: locationSchema,
  dropoffLocation: locationSchema,
  pickupContactName: z.string(),
  pickupContactPhone: z.string(),
  dropoffContactName: z.string(),
  dropoffContactPhone: z.string(),
  type: z.nativeEnum(PARCEL_TYPE),
  weight: z.number().optional(),
  sizeCategory: z.nativeEnum(SIZE_CATEGORY),
  paymentMode: z.nativeEnum(PAYMENT_MODE).default("COD"),
  deliveryFee: z.number().default(0),
  totalAmount: z.number().default(0),
});

export type ParcelInput = z.infer<typeof parcelSchema>;

export const ParcelValidation = {
  parcelSchema,
};
