import { z } from "zod";
import { JAMB_EXAM_TYPES } from "@/types/enums";

const CURRENT_YEAR = new Date().getFullYear();

export const jambSubjectScoreSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required"),
  score: z.coerce
    .number({ error: "Enter a score between 0 and 100" })
    .int()
    .min(0, "Score must be at least 0")
    .max(100, "Score cannot exceed 100"),
});

export const jambSchema = z
  .object({
    registrationNumber: z
      .string()
      .trim()
      .min(1, "JAMB registration number is required"),
    examYear: z.coerce
      .number({ error: "Enter a valid year" })
      .int()
      .min(1990, "Enter a valid year")
      .max(CURRENT_YEAR, "Year cannot be in the future"),
    examType: z.enum(JAMB_EXAM_TYPES, { error: "Select an exam type" }),
    firstChoiceInstitution: z
      .string()
      .trim()
      .min(1, "First choice institution is required"),
    courseApplied: z.string().trim().min(1, "Course applied for is required"),
    subjects: z
      .array(jambSubjectScoreSchema)
      .length(4, "Exactly 4 UTME subjects are required"),
    score: z.number().optional(),
  })
  .refine(
    (data) => {
      const subjects = data.subjects.map((s) => s.subject.trim().toLowerCase());
      return subjects.some(
        (s) =>
          s === "use of english" ||
          s === "english" ||
          s === "english language",
      );
    },
    {
      message: "Use of English is compulsory.",
      path: ["subjects"],
    },
  )
  .refine(
    (data) => {
      const subjects = data.subjects.map((s) => s.subject.trim().toLowerCase());
      return new Set(subjects).size === data.subjects.length;
    },
    {
      message: "Duplicate subjects are not allowed.",
      path: ["subjects"],
    },
  );

export type JambSubjectInput = z.input<typeof jambSubjectScoreSchema>;
export type JambSubjectFormValues = z.output<typeof jambSubjectScoreSchema>;
export type JambInput = z.input<typeof jambSchema>;
export type JambFormValues = z.output<typeof jambSchema>;

