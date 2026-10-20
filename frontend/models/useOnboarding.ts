import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useSyncExternalStore } from "react";
import { ApiError } from "@/api/ApiClient";
import { categoriesApi } from "@/api/categories";
import { incomeSourcesApi } from "@/api/incomeSources";
import { clearOnboardingPending, isOnboardingPending, markOnboardingPending } from "@/api/onboardingMark";
import { plansApi } from "@/api/plans";
import { currentMonth } from "@/lib/format";
import type { OnboardingSetup } from "@/types/onboarding";

// A new account must go through the onboarding before using the app
export const startOnboarding = (): void => markOnboardingPending();

export const cancelOnboarding = (): void => clearOnboardingPending();

const noSubscribe = () => () => {};

export function useOnboardingPending(): boolean | null {
  return useSyncExternalStore(noSubscribe, isOnboardingPending, () => null);
}

const createInOrder = <T, R>(items: T[], create: (item: T) => Promise<R>): Promise<R[]> =>
  items.reduce<Promise<R[]>>(async (done, item) => [...(await done), await create(item)], Promise.resolve([]));

const removeLeftoverPlan = (planId: string) =>
  plansApi.remove(planId).catch((error) => {
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  });

export function useSetUpBudget() {
  const queryClient = useQueryClient();
  // Set while a plan exists from an attempt that hasn't finished, so trying again starts over instead of adding a second plan
  const [leftoverPlanId, setLeftoverPlanId] = useState<string | null>(null);

  return useMutation({
    mutationFn: async (setup: OnboardingSetup) => {
      if (leftoverPlanId) await removeLeftoverPlan(leftoverPlanId);
      setLeftoverPlanId(null);

      const plan = await plansApi.create({ name: setup.planName });
      setLeftoverPlanId(plan.id);
      await plansApi.setCurrent(plan.id);

      await incomeSourcesApi.create(plan.id, { name: "Income", monthlyAmount: setup.income });

      const subcategories = await createInOrder(setup.categories, async (category) => {
        const created = await categoriesApi.create(plan.id, { name: category.name, maxBudget: 0 });
        return createInOrder(category.subcategories, (subcategory) =>
          categoriesApi.createSubcategory(created.id, subcategory),
        );
      });

      const targetedIds = subcategories
        .flat()
        .filter((subcategory) => subcategory.target !== null)
        .map((subcategory) => subcategory.id);
      if (targetedIds.length > 0) await categoriesApi.fundTargets(plan.id, currentMonth(), targetedIds);
    },
    onSuccess: () => {
      setLeftoverPlanId(null);
      clearOnboardingPending();
      return queryClient.invalidateQueries();
    },
  });
}
