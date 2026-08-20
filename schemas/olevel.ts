import { z } from "zod";
import { EXAM_TYPES, OLEVEL_GRADES } from "@/types/enums";

const CURRENT_YEAR = new Date().getFullYear();

export const olevelSubjectSchema = z.object({
  subject: z.string().trim().min(1, "Select a subject"),
  grade: z.enum(OLEVEL_GRADES, { error: "Select a grade" }),
});

export const olevelSittingSchema = z.object({
  examType: z.enum(EXAM_TYPES, { error: "Select an exam type" }),
  examNumber: z.string().trim().min(1, "Examination number is required"),
  examYear: z.coerce
    .number({ error: "Enter a valid year" })
    .int()
    .min(1990, "Enter a valid year")
    .max(CURRENT_YEAR, "Year cannot be in the future"),
  examCentre: z.string().trim().min(1, "Examination centre is required"),
  subjects: z
    .array(olevelSubjectSchema)
    .min(5, "Enter at least 5 subjects")
    .max(9, "You can enter at most 9 subjects"),
});

export type OlevelSubjectFormValues = z.infer<typeof olevelSubjectSchema>;
export type OlevelSittingFormValues = z.infer<typeof olevelSittingSchema>;
