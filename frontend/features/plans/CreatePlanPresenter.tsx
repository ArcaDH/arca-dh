"use client";

import { useState } from "react";
import { useCreatePlan, useSetCurrentPlan } from "@/models/usePlans";
import CreatePlanView from "./CreatePlanView";

interface CreatePlanPresenterProps {
  onClose: () => void;
}

export default function CreatePlanPresenter({ onClose }: CreatePlanPresenterProps) {
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
}
