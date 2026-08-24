/**
 * The applicant's single profile. In the API one profile backs what the app
 * treats as two separate sections — "personal" and "contact" — so both the
 * personal and contact wizard steps read from and write to this resource
 * (see the `profileTo*` / `*ToProfilePatch` adapters).
 */

import { api } from "@/lib/api";
import type {
  ApiApplicantProfile,
  ApiApplicantProfilePatch,
} from "@/lib/api/types";

/** GET /applicant/profile/ — the current applicant's profile. */
export function getProfile(): Promise<ApiApplicantProfile> {
  return api.get<ApiApplicantProfile>("/applicant/profile/");
}

/** PATCH /applicant/profile/ — partial update; returns the full updated profile. */
export function updateProfile(
  patch: ApiApplicantProfilePatch,
): Promise<ApiApplicantProfile> {
  return api.patch<ApiApplicantProfile>("/applicant/profile/", patch);
}
