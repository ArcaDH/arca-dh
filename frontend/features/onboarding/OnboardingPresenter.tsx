"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEFAULT_PICKS,
  ONBOARDING_STEPS,
  onboardingSetup,
  picksAreValid,
  plannedSummary,
  starterTiles,
  stepNumber,
  suggestedAmount,
} from "@/lib/onboarding";
import { parseKr } from "@/lib/money";
import { useOnboardingPending, useSetUpBudget } from "@/models/useOnboarding";
import type { OnboardingStep, StarterPicks } from "@/types/onboarding";
import { BasicsStepView } from "./BasicsStepView";
import { CategoriesStepView } from "./CategoriesStepView";
import { OnboardingView } from "./OnboardingView";

export const OnboardingPresenter = () => {
  const router = useRouter();
  const setUpBudget = useSetUpBudget();
  const pending = useOnboardingPending();
  const [step, setStep] = useState<OnboardingStep>("basics");
  const [planName, setPlanName] = useState("My budget");
  const [incomeText, setIncomeText] = useState("");
  const [picks, setPicks] = useState<StarterPicks>(DEFAULT_PICKS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pending === false) router.replace("/");
  }, [pending, router]);

  // Step 1 needs a name and an income above zero before moving on
  const income = parseKr(incomeText) ?? 0;
  const canContinue = planName.trim() !== "" && income > 0;

  function goToCategories() {
    if (!canContinue) return setError("Enter your budget's name and an income like 18500.");
    setError(null);
    setStep("categories");
  }

  function togglePick(key: string) {
    setPicks((current) =>
      key in current
        ? Object.fromEntries(Object.entries(current).filter(([picked]) => picked !== key))
        : { ...current, [key]: suggestedAmount(key) },
    );
  }

  function createBudget(chosen: StarterPicks) {
    if (!picksAreValid(chosen)) return setError("Enter amounts like 3000 or 249,50, or leave them blank.");
    setError(null);
    setUpBudget.mutate(onboardingSetup(planName, income, chosen), {
      onSuccess: () => router.replace("/"),
      onError: (failure) => setError(failure.message),
    });
  }

  if (pending !== true) return null;

  return (
    <OnboardingView stepNumber={stepNumber(step)} stepCount={ONBOARDING_STEPS.length} wide={step === "categories"}>
      {step === "basics" ? (
        <BasicsStepView
          planName={planName}
          income={incomeText}
          canContinue={canContinue}
          error={error}
          onPlanNameChange={setPlanName}
          onIncomeChange={setIncomeText}
          onContinue={goToCategories}
        />
      ) : (
        <CategoriesStepView
          groups={starterTiles(picks)}
          summary={plannedSummary(income, picks)}
          error={error}
          isSaving={setUpBudget.isPending}
          onToggle={togglePick}
          onAmountChange={(key, amount) => setPicks((current) => ({ ...current, [key]: amount }))}
          onBack={() => {
            setError(null);
            setStep("basics");
          }}
          onSkip={() => createBudget({})}
          onSubmit={() => createBudget(picks)}
        />
      )}
    </OnboardingView>
  );
};
