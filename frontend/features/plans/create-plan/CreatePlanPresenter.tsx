"use client";

import { useState, type FC } from "react";
import { useCreatePlan, useSetCurrentPlan } from "@/models/usePlans";
import { CreatePlanView } from "./CreatePlanView";

interface CreatePlanPresenterProps {
  onClose: () => void;
}

export const CreatePlanPresenter: FC<CreatePlanPresenterProps> = ({ onClose }) => {
  const [name, setName] = useState("");
  const createPlan = useCreatePlan();
  const setCurrentPlan = useSetCurrentPlan();

  function handleSubmit() {
    createPlan.mutate(
      { name: name.trim() },
      { onSuccess: (plan) => setCurrentPlan.mutate(plan.id, { onSuccess: onClose }) },
    );
  }

  return (
    <CreatePlanView
      name={name}
      error={(createPlan.error ?? setCurrentPlan.error)?.message ?? null}
      isSaving={createPlan.isPending || setCurrentPlan.isPending}
      onNameChange={setName}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
};
