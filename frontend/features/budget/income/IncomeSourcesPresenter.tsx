"use client";

import { useState, type FC } from "react";
import { parseKr, sumKr } from "@/lib/money";
import {
  useCreateIncomeSource,
  useDeleteIncomeSource,
  useIncomeSources,
  useUpdateIncomeSource,
} from "@/models/useIncomeSources";
import { IncomeSourcesView } from "./IncomeSourcesView";
import type { IncomeForm } from "@/types/budget";

const emptyForm: IncomeForm = { name: "", amount: "" };

// Checks a name and amount, and returns what to send or why it can't be sent
function toInput(form: IncomeForm) {
  const name = form.name.trim();
  const monthlyAmount = parseKr(form.amount);
  if (!name) return { error: "Enter a name, like Salary." };
  if (monthlyAmount === null || monthlyAmount <= 0) return { error: "Enter an amount per month, like 25000." };
  return { input: { name, monthlyAmount } };
}

interface IncomeSourcesPresenterProps {
  planId: string;
  onClose: () => void;
}

export const IncomeSourcesPresenter: FC<IncomeSourcesPresenterProps> = ({ planId, onClose }) => {
  const [editing, setEditing] = useState<({ id: string } & IncomeForm) | null>(null);
  const [newSource, setNewSource] = useState<IncomeForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const sources = useIncomeSources(planId);
  const createSource = useCreateIncomeSource(planId);
  const updateSource = useUpdateIncomeSource(planId);
  const deleteSource = useDeleteIncomeSource(planId);

  const onError = (error: Error) => setFormError(error.message);

  function add() {
    const result = toInput(newSource);
    if (!result.input) return setFormError(result.error);
    setFormError(null);
    createSource.mutate(result.input, { onSuccess: () => setNewSource(emptyForm), onError });
  }

  function saveEdit() {
    if (!editing) return;
    const result = toInput(editing);
    if (!result.input) return setFormError(result.error);
    setFormError(null);
    updateSource.mutate({ id: editing.id, input: result.input }, { onSuccess: () => setEditing(null), onError });
  }

  return (
    <IncomeSourcesView
      sources={sources.data ?? null}
      total={sumKr((sources.data ?? []).map((source) => Number(source.monthlyAmount)))}
      editing={editing}
      newSource={newSource}
      isSaving={createSource.isPending || updateSource.isPending}
      error={formError ?? (sources.error ?? deleteSource.error)?.message ?? null}
      onStartEdit={(source) => setEditing({ id: source.id, name: source.name, amount: source.monthlyAmount })}
      onEditChange={(changes) => setEditing((current) => current && { ...current, ...changes })}
      onSaveEdit={saveEdit}
      onCancelEdit={() => setEditing(null)}
      onDelete={(source) => deleteSource.mutate(source.id)}
      onNewChange={(changes) => setNewSource((current) => ({ ...current, ...changes }))}
      onAdd={add}
      onClose={onClose}
    />
  );
};
