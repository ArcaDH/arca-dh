import { Repeat } from "lucide-react";
import Button from "@/components/ui/button";
import IconTile from "@/components/ui/IconTile";
import { formatDay } from "@/lib/format";
import { formatSignedKr } from "@/lib/money";
import type { MonthlyPaymentRow } from "@/types/monthlyPayment";
import TagChipView from "../tag-chip/TagChipView";

interface MonthlyPaymentsViewProps {
  payments: MonthlyPaymentRow[];
  onStop: (payment: MonthlyPaymentRow) => void;
}

/** The active monthly payments, or an invitation to make the first one. */
export default function MonthlyPaymentsView({ payments, onStop }: MonthlyPaymentsViewProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-secondary/20 bg-secondary/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-secondary">Repeats every month</p>
          <h2 className="font-heading text-xl font-semibold">Monthly payments</h2>
        </div>
        <IconTile className="bg-white text-secondary">
          <Repeat size={17} />
        </IconTile>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-foreground/60">
          Nothing repeats yet. Turn on &quot;Repeat monthly&quot; when you log an expense and it shows up here.
        </p>
      ) : (
        <ul aria-label="Monthly payments">
          {payments.map((payment) => (
            <li key={payment.id} className="flex items-start gap-3 border-t border-secondary/20 py-3 first:border-t-0">
              <span
                aria-hidden
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-medium ${payment.ink}`}
              >
                {payment.initial}
              </span>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{payment.title}</p>
                <p className="truncate text-xs text-foreground/60">{payment.detail}</p>
                <p className="text-xs text-foreground/60">Next: {formatDay(payment.nextCharge)}</p>
                {payment.tags.length > 0 && (
                  <ul aria-label="Tags" className="mt-1 flex flex-wrap gap-1">
                    {payment.tags.map((tag) => (
                      <li key={tag.id} className="max-w-full">
                        <TagChipView tag={tag} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm text-accent">{formatSignedKr(payment.amount)}</span>
                <Button variant="ghost" size="sm" onClick={() => onStop(payment)} aria-label={`Stop ${payment.title}`}>
                  Stop
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
