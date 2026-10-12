"use client";

import { useState } from "react";
import { useDeletePlan, usePlans, useSetCurrentPlan, useUpdatePlan } from "@/models/usePlans";
import type { Plan } from "@/types/plan";
import ManagePlansView from "./ManagePlansView";

interface ManagePlansPresenterProps {
  onClose: () => void;
}

export default function ManagePlansPresenter({ onClose }: ManagePlansPresenterProps) {
  const [editing, setEditing] = useState<{ planId: string; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const plans = usePlans();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const setCurrentPlan = useSetCurrentPlan();

  function startEdit(plan: Plan) {
    setDeletingId(null);
    setEditing({ planId: plan.id, name: plan.name });
  }

  function saveEdit() {
    if (!editing) return;
    updatePlan.mutate(
      { planId: editing.planId, input: { name: editing.name.trim() } },
      { onSuccess: () => setEditing(null) },
    );
  }

  function askDelete(planId: string) {
    setEditing(null);
    setDeletingId(planId);
  }

  function confirmDelete() {
    const deleted = plans.data?.find((plan) => plan.id === deletingId);
    if (!deleted) return;
    const next = plans.data?.find((plan) => plan.id !== deleted.id);

    deletePlan.mutate(deleted.id, {
      onSuccess: () => {
        setDeletingId(null);
        if (deleted.current && next) setCurrentPlan.mutate(next.id);
      },
    });
  }

  return (
    <ManagePlansView
      plans={plans.data ?? []}
      editing={editing}
      deletingId={deletingId}
      isSaving={updatePlan.isPending || deletePlan.isPending}
      error={(updatePlan.error ?? deletePlan.error ?? setCurrentPlan.error)?.message ?? null}
      onStartEdit={startEdit}
      onEditName={(name) => setEditing((current) => current && { ...current, name })}
      onSaveEdit={saveEdit}
      onCancelEdit={() => setEditing(null)}
      onAskDelete={askDelete}
      onConfirmDelete={confirmDelete}
      onCancelDelete={() => setDeletingId(null)}
      onClose={onClose}
    />
  );
}
