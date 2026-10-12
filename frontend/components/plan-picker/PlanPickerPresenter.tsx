"use client";

import { useState } from "react";
import CreatePlanPresenter from "@/features/plans/CreatePlanPresenter";
import ManagePlansPresenter from "@/features/plans/ManagePlansPresenter";
import { useCurrentPlan, usePlans, useSetCurrentPlan } from "@/models/usePlans";
import PlanPickerView from "./PlanPickerView";

type OpenDialog = "create" | "manage" | null;

interface PlanPickerPresenterProps {
  collapsed: boolean;
}

export default function PlanPickerPresenter({ collapsed }: PlanPickerPresenterProps) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const plans = usePlans();
  const currentPlan = useCurrentPlan();
  const setCurrentPlan = useSetCurrentPlan();

  const closeDialog = () => setOpenDialog(null);
  const dialogs = {
    create: <CreatePlanPresenter onClose={closeDialog} />,
    manage: <ManagePlansPresenter onClose={closeDialog} />,
  };

  return (
    <PlanPickerView
      plans={plans.data ?? []}
      currentPlan={currentPlan.data ?? null}
      collapsed={collapsed}
      isSwitching={setCurrentPlan.isPending}
      dialog={openDialog && dialogs[openDialog]}
      onSelect={(planId) => setCurrentPlan.mutate(planId)}
      onCreate={() => setOpenDialog("create")}
      onManage={() => setOpenDialog("manage")}
    />
  );
}
