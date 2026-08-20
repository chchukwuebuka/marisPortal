import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

export function StepActions({
  backHref,
  submitLabel = "Save & continue",
  loading,
  submitDisabled,
  onContinue,
}: {
  backHref: string;
  submitLabel?: string;
  loading?: boolean;
  submitDisabled?: boolean;
  /** When provided, the continue button navigates via onClick instead of
   *  submitting a form (used by steps that aren't a single RHF form). */
  onContinue?: () => void;
}) {
  return (
    <>
      <Button
        href={backHref}
        variant="outline"
        leftIcon={<ArrowLeft size={16} />}
      >
        Back
      </Button>
      <Button
        type={onContinue ? "button" : "submit"}
        onClick={onContinue}
        loading={loading}
        disabled={submitDisabled}
        rightIcon={<ArrowRight size={16} />}
      >
        {submitLabel}
      </Button>
    </>
  );
}
