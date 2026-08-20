import { z } from "zod";

export const programmeSchema = z.object({
  schoolId: z.string().min(1, "Select a school"),
  departmentId: z.string().min(1, "Select a department"),
  programmeId: z.string().min(1, "Select a programme"),
});

export type ProgrammeFormValues = z.infer<typeof programmeSchema>;
