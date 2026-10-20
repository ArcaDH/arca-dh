import type { FC, ReactNode } from "react";

interface OnboardingViewProps {
  stepNumber: number;
  stepCount: number;
  wide: boolean;
  children: ReactNode;
}

export const OnboardingView: FC<OnboardingViewProps> = ({ stepNumber, stepCount, wide, children }) => {
  return (
    // Step 1 is a short form, step 2 needs room for the category tiles
    <div className={`w-full ${wide ? "max-w-2xl" : "max-w-xl"}`}>
      <p className="sr-only">
        Step {stepNumber} of {stepCount}
      </p>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: stepCount }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${index < stepNumber ? "bg-primary" : "bg-foreground/10"}`}
          />
        ))}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
};
