import { z } from "zod";

const phone = (label: string) =>
  z
    .string()
    .trim()
    .min(7, `Enter a valid ${label}`)
    .regex(/^[0-9+\-\s()]+$/, `Enter a valid ${label}`);

export const contactSchema = z.object({
  phone: phone("phone number"),
  altPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s()]*$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email"),
  residentialAddress: z
    .string()
    .trim()
    .min(1, "Residential address is required"),
  emergencyContactName: z
    .string()
    .trim()
    .min(1, "Emergency contact name is required"),
  emergencyContactPhone: phone("emergency contact phone"),
  emergencyContactRelationship: z
    .string()
    .trim()
    .min(1, "Relationship is required"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
