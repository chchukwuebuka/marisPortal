import { Check } from "lucide-react";
import type { LegacyRegistrationDetail } from "@/types/legacy";
import { STEPS } from "../types";
import styles from "../existing-student.module.css";

interface StepperNavProps {
  step: number;
  maxStepReached: number;
  registration: LegacyRegistrationDetail | null;
  onStepClick: (stepNum: number) => void;
  progressPercent: number;
  currentStepObj: (typeof STEPS)[0];
}

export function StepperNav({
  step,
  maxStepReached,
  registration,
  onStepClick,
  progressPercent,
  currentStepObj,
}: StepperNavProps) {
  return (
    <>
      {/* Desktop Stepper */}
      <nav className={styles.stepperDesktop} aria-label="Onboarding Progress">
        {STEPS.map((s, idx) => {
          const active = step === s.num;
          const completed = step > s.num || (step === 5 && s.num < 5);
          const isClickable = s.num <= maxStepReached || (registration && s.num <= 4);

          return (
            <div
              key={s.num}
              style={{
                display: "flex",
                alignItems: "center",
                flex: idx === STEPS.length - 1 ? 0 : 1,
              }}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(s.num)}
                disabled={!isClickable}
                className={`${styles.stepItem} ${active ? styles.stepActive : ""} ${
                  completed ? styles.stepCompleted : ""
                } ${isClickable ? styles.stepItemClickable : ""}`}
                title={s.label}
              >
                <div className={styles.stepCircle}>
                  {completed ? <Check size={14} strokeWidth={3} /> : s.num}
                </div>
                <span>{s.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div
                  className={`${styles.stepDivider} ${
                    completed ? styles.stepDividerFilled : ""
                  }`}
                />
              )}
            </div>
          );
        })}
      </nav>

      {/* Mobile Stepper */}
      <div className={styles.stepperMobile}>
        <div className={styles.stepperMobileTop}>
          <span className={styles.stepperMobileBadge}>
            Step {step} of {STEPS.length}
          </span>
          <span className={styles.stepperMobileTitle}>{currentStepObj.shortTitle}</span>
        </div>
        <div className={styles.progressBarTrack}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className={styles.stepperMobileDots}>
          {STEPS.map((s) => {
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            const isClickable = s.num <= maxStepReached || (registration && s.num <= 4);

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => isClickable && onStepClick(s.num)}
                disabled={!isClickable}
                className={`${styles.mobileDot} ${isActive ? styles.mobileDotActive : ""} ${
                  isCompleted ? styles.mobileDotCompleted : ""
                }`}
              >
                {isCompleted ? "✓" : s.num}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
