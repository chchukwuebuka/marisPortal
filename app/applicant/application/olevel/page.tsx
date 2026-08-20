"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApplication } from "@/hooks/useApplication";
import { SittingCard, StepActions, StepPanel } from "@/components/application";
import { Alert, Checkbox } from "@/components/ui";
import { stepNav } from "@/lib/flow";
import { uid } from "@/services";
import type { OLevelResult } from "@/types/domain";
import type { OlevelSubjectFormValues } from "@/schemas";
import styles from "./olevel.module.css";

function newSitting(): OLevelResult {
  return {
    id: uid("sit"),
    examType: "" as OLevelResult["examType"],
    examNumber: "",
    examYear: 0,
    examCentre: "",
    subjects: [],
  };
}

export default function OlevelStep() {
  const router = useRouter();
  const { application, setOlevel, setPresentingTwoSittings, stepStatus } =
    useApplication();
  const nav = stepNav("olevel");

  const olevel = application.olevel;
  const presenting = application.presentingTwoSittings;

  // Keep the number of sittings in sync with the two-sittings toggle, and
  // ensure there is always at least one sitting to edit.
  useEffect(() => {
    const desired = presenting ? 2 : 1;
    if (olevel.length === desired) return;
    let next = [...olevel];
    while (next.length < desired) next.push(newSitting());
    if (next.length > desired) next = next.slice(0, desired);
    setOlevel(next);
  }, [presenting, olevel, setOlevel]);

  function patchSitting(index: number, patch: Partial<OLevelResult>) {
    setOlevel(olevel.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addSubject(index: number, values: OlevelSubjectFormValues) {
    setOlevel(
      olevel.map((s, i) =>
        i === index
          ? { ...s, subjects: [...s.subjects, { id: uid("subj"), ...values }] }
          : s,
      ),
    );
  }

  function removeSubject(index: number, subjectId: string) {
    setOlevel(
      olevel.map((s, i) =>
        i === index
          ? { ...s, subjects: s.subjects.filter((x) => x.id !== subjectId) }
          : s,
      ),
    );
  }

  return (
    <StepPanel
      title="O'Level Information"
      description="Enter your WAEC, NECO, or NABTEB results. You need at least five subjects including English Language and Mathematics."
      footer={
        <StepActions
          backHref={nav.prevHref}
          onContinue={() => router.push(nav.nextHref)}
          submitDisabled={!stepStatus.olevel}
        />
      }
    >
      <div className={styles.intro}>
        <Alert tone="info" title="Combining results from two sittings">
          If you sat your O&apos;Level in two different examinations, tick the
          box below to add a second sitting. At least one sitting must have five
          or more credits including English Language and Mathematics.
        </Alert>
        <Checkbox
          checked={presenting}
          onChange={(e) => setPresentingTwoSittings(e.target.checked)}
          label="I am presenting results from two sittings"
          hint="Adds a second result card below."
        />
      </div>

      {olevel.map((sitting, index) => (
        <SittingCard
          key={sitting.id}
          index={index}
          sitting={sitting}
          onChangeMeta={(patch) => patchSitting(index, patch)}
          onAddSubject={(values) => addSubject(index, values)}
          onRemoveSubject={(subjectId) => removeSubject(index, subjectId)}
        />
      ))}
    </StepPanel>
  );
}
