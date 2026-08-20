"use client";

import { useRouter } from "next/navigation";
import { useApplication } from "@/hooks/useApplication";
import {
  ReviewRow,
  ReviewSection,
  StepActions,
  StepPanel,
} from "@/components/application";
import { Checkbox, DocStatusTag } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import {
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  stepPath,
} from "@/lib/constants";
import { formatDate } from "@/lib/format";
import {
  findDepartment,
  findProgramme,
  findSchool,
  findSession,
  getRequirementsSync,
} from "@/services";
import styles from "./review.module.css";

export default function ReviewStep() {
  const router = useRouter();
  const { application, stepStatus, getDocument, setConfirmedAccuracy } =
    useApplication();
  const nav = stepNav("review");

  const p = application.personal ?? {};
  const c = application.contact ?? {};
  const prog = application.programme ?? {};
  const j = application.jamb ?? {};

  const fullName = [p.firstName, p.middleName, p.lastName]
    .filter(Boolean)
    .join(" ");
  const programme = findProgramme(prog.programmeId);
  const requirements = getRequirementsSync(prog.programmeId);

  return (
    <StepPanel
      title="Review & Submit"
      description="Check every section carefully. Use the edit links to make changes before you submit."
      footer={
        <StepActions
          backHref={nav.prevHref}
          submitLabel="Continue to submit"
          onContinue={() => router.push(nav.nextHref)}
          submitDisabled={!application.confirmedAccuracy}
        />
      }
    >
      <div className={styles.sections}>
        <ReviewSection
          title="Personal Information"
          editHref={stepPath("personal")}
          complete={stepStatus.personal}
        >
          <ReviewRow label="Full name" value={fullName} />
          <ReviewRow
            label="Date of birth"
            value={p.dateOfBirth ? formatDate(p.dateOfBirth) : undefined}
          />
          <ReviewRow
            label="Gender"
            value={p.gender ? GENDER_LABELS[p.gender] : undefined}
          />
          <ReviewRow
            label="Marital status"
            value={
              p.maritalStatus
                ? MARITAL_STATUS_LABELS[p.maritalStatus]
                : undefined
            }
          />
          <ReviewRow label="Nationality" value={p.nationality} />
          <ReviewRow label="State of origin" value={p.stateOfOrigin} />
          <ReviewRow label="LGA" value={p.lga} />
          <ReviewRow
            label="Residential address"
            value={p.residentialAddress}
            wide
          />
        </ReviewSection>

        <ReviewSection
          title="Contact Information"
          editHref={stepPath("contact")}
          complete={stepStatus.contact}
        >
          <ReviewRow label="Phone number" value={c.phone} />
          <ReviewRow label="Alternate phone" value={c.altPhone} />
          <ReviewRow label="Email address" value={c.email} wide />
          <ReviewRow
            label="Emergency contact"
            value={c.emergencyContactName}
          />
          <ReviewRow
            label="Emergency phone"
            value={c.emergencyContactPhone}
          />
          <ReviewRow
            label="Relationship"
            value={c.emergencyContactRelationship}
          />
        </ReviewSection>

        <ReviewSection
          title="Programme Selection"
          editHref={stepPath("programme")}
          complete={stepStatus.programme}
        >
          <ReviewRow
            label="Session"
            value={findSession(prog.sessionId)?.name}
          />
          <ReviewRow
            label="School / Faculty"
            value={findSchool(prog.schoolId)?.name}
          />
          <ReviewRow
            label="Department"
            value={findDepartment(prog.departmentId)?.name}
          />
          <ReviewRow
            label="Programme"
            value={
              programme ? `${programme.level} — ${programme.name}` : undefined
            }
            wide
          />
        </ReviewSection>

        <ReviewSection
          title="Educational Background"
          editHref={stepPath("education")}
          complete={stepStatus.education}
        >
          <ReviewRow
            label="Institutions attended"
            wide
            value={
              application.education.length > 0 ? (
                <ul className={styles.miniList}>
                  {application.education.map((r) => (
                    <li key={r.id}>
                      <span className={styles.miniPrimary}>
                        {r.institution}
                      </span>
                      <span className={styles.miniMeta}>
                        {r.qualification} · {r.startYear}–{r.endYear}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : undefined
            }
          />
        </ReviewSection>

        <ReviewSection
          title="O'Level Information"
          editHref={stepPath("olevel")}
          complete={stepStatus.olevel}
        >
          {application.olevel.some((s) => s.subjects.length > 0) ? (
            application.olevel.map((s, i) => (
              <ReviewRow
                key={s.id}
                wide
                label={`Sitting ${i + 1}${s.examType ? ` — ${s.examType}` : ""}${
                  s.examYear ? ` (${s.examYear})` : ""
                }`}
                value={
                  s.subjects.length > 0 ? (
                    <>
                      <div className={styles.subjects}>
                        {s.subjects.map((sub) => (
                          <span key={sub.id} className={styles.subjectPill}>
                            {sub.subject}
                            <strong>{sub.grade}</strong>
                          </span>
                        ))}
                      </div>
                      {s.examNumber && (
                        <p className={styles.note}>
                          Exam no. {s.examNumber}
                          {s.examCentre && ` · ${s.examCentre}`}
                        </p>
                      )}
                    </>
                  ) : undefined
                }
              />
            ))
          ) : (
            <ReviewRow label="Subjects" wide value={undefined} />
          )}
        </ReviewSection>

        <ReviewSection
          title="JAMB Information"
          editHref={stepPath("jamb")}
          complete={stepStatus.jamb}
        >
          <ReviewRow label="Registration number" value={j.registrationNumber} />
          <ReviewRow label="Exam type" value={j.examType} />
          <ReviewRow label="Exam year" value={j.examYear || undefined} />
          <ReviewRow
            label="Score"
            value={typeof j.score === "number" ? `${j.score} / 400` : undefined}
          />
          <ReviewRow
            label="First choice institution"
            value={j.firstChoiceInstitution}
          />
          <ReviewRow label="Course applied" value={j.courseApplied} />
        </ReviewSection>

        <ReviewSection
          title="Documents"
          editHref={stepPath("documents")}
          complete={stepStatus.documents}
        >
          <ReviewRow
            label="Uploaded documents"
            wide
            value={
              <ul className={styles.docList}>
                {requirements.map((req) => {
                  const doc = getDocument(req.id);
                  return (
                    <li key={req.id} className={styles.docItem}>
                      <span className={styles.docName}>
                        {req.name}
                        {req.required && <span className={styles.req}>*</span>}
                      </span>
                      {doc?.fileName ? (
                        <DocStatusTag status={doc.status} />
                      ) : (
                        <span className={styles.missing}>Not uploaded</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            }
          />
        </ReviewSection>
      </div>

      <div className={styles.confirm}>
        <Checkbox
          checked={application.confirmedAccuracy}
          onChange={(e) => setConfirmedAccuracy(e.target.checked)}
          label="I confirm that the information provided is accurate and complete"
          hint="Submitting false information may lead to disqualification. You cannot edit your application after submission."
        />
      </div>
    </StepPanel>
  );
}
