import { z } from "zod";

const CURRENT_YEAR = new Date().getFullYear();

export const educationSchema = z
  .object({
    institution: z.string().trim().min(1, "Institution name is required"),
    qualification: z.string().trim().min(1, "Qualification is required"),
    startYear: z.coerce
      .number({ error: "Enter a valid year" })
      .int()
      .min(1950, "Enter a valid year")
      .max(CURRENT_YEAR, "Year cannot be in the future"),
    endYear: z.coerce
      .number({ error: "Enter a valid year" })
      .int()
      .min(1950, "Enter a valid year")
      .max(CURRENT_YEAR + 10, "Enter a valid year"),
  })
  .refine((d) => d.endYear >= d.startYear, {
    error: "End year must be on or after the start year",
    path: ["endYear"],
  });

export type EducationInput = z.input<typeof educationSchema>;
export type EducationFormValues = z.output<typeof educationSchema>;
