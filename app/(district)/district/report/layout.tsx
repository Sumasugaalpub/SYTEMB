import { StepProgress } from "@/components/phone/StepProgress";

/** Progress bar wrapper for the six report steps. */
export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StepProgress />
      {children}
    </>
  );
}
