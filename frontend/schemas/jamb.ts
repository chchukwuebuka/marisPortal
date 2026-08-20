import { z } from "zod";
import { JAMB_EXAM_TYPES } from "@/types/enums";

const CURRENT_YEAR = new Date().getFullYear();

export const jambSchema = z.object({
  registrationNumber: z
    .string()
    .trim()
    .min(1, "JAMB registration number is required"),
  examYear: z.coerce
    .number({ error: "Enter a valid year" })
    .int()
    .min(1990, "Enter a valid year")
    .max(CURRENT_YEAR, "Year cannot be in the future"),
  score: z.coerce
    .number({ error: "Enter your score" })
    .int()
    .min(0, "Score must be between 0 and 400")
    .max(400, "Score must be between 0 and 400"),
  examType: z.enum(JAMB_EXAM_TYPES, { error: "Select an exam type" }),
  firstChoiceInstitution: z
    .string()
    .trim()
    .min(1, "First choice institution is required"),
  courseApplied: z.string().trim().min(1, "Course applied for is required"),
});

export type JambInput = z.input<typeof jambSchema>;
export type JambFormValues = z.output<typeof jambSchema>;
