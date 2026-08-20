import { z } from "zod";
import { GENDERS, MARITAL_STATUSES } from "@/types/enums";

export const personalSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  middleName: z.string().trim().optional(),
  lastName: z.string().trim().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(GENDERS, { error: "Select a gender" }),
  nationality: z.string().trim().min(1, "Nationality is required"),
  stateOfOrigin: z.string().trim().min(1, "State of origin is required"),
  lga: z.string().trim().min(1, "Local Government Area is required"),
  maritalStatus: z.enum(MARITAL_STATUSES, { error: "Select marital status" }),
  residentialAddress: z
    .string()
    .trim()
    .min(1, "Residential address is required"),
});

export type PersonalFormValues = z.infer<typeof personalSchema>;
