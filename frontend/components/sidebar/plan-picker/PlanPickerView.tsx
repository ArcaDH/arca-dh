import { Check, ChevronsUpDown, Plus, Settings } from "lucide-react";
import type { FC, ReactNode } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import { MenuItem } from "@/components/ui/MenuItem";
import type { Plan } from "@/types/plan";

interface PlanPickerViewProps {
  plans: Plan[];
  currentPlan: Plan | null;
  collapsed: boolean;
  isSwitching: boolean;
  dialog: ReactNode;
  onSelect: (planId: string) => void;
  onCreate: () => void;
  onManage: () => void;
}

export const PlanPickerView: FC<PlanPickerViewProps> = ({
  plans,
  currentPlan,
  collapsed,
  isSwitching,
  dialog,
  onSelect,
  onCreate,
  onManage,
}) => {
  const name = currentPlan?.name ?? "No plan yet";

  return (
    <>
      <Dropdown
        label={collapsed ? `Current plan: ${name}` : undefined}
        triggerClassName={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-foreground/5 ${
          isSwitching ? "opacity-60" : ""
        }`}
        trigger={
          <>
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-white">
              {name.charAt(0).toUpperCase()}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                <ChevronsUpDown size={16} className="shrink-0 text-foreground/50" aria-hidden />
              </>
            )}
          </>
        }
      >
        {(close) => (
          <>
            <p className="px-2.5 pt-1.5 pb-1 text-xs text-foreground/50">Plans</p>
            {plans.map((plan) => (
              <MenuItem
                key={plan.id}
                role="menuitemradio"
                aria-checked={plan.current}
                onClick={() => {
                  onSelect(plan.id);
                  close();
                }}
              >
                <span className="min-w-0 flex-1 truncate">{plan.name}</span>
                {plan.current && <Check size={16} className="shrink-0 text-primary" aria-hidden />}
              </MenuItem>
            ))}

            <div className="my-1 border-t border-foreground/10" />

            <MenuItem
              onClick={() => {
                onCreate();
                close();
              }}
            >
              <Plus size={16} aria-hidden />
              Create plan
            </MenuItem>
            <MenuItem
              onClick={() => {
                onManage();
                close();
              }}
            >
              <Settings size={16} aria-hidden />
              Manage plans
            </MenuItem>
          </>
        )}
      </Dropdown>

      {dialog}
    </>
  );
};
