import Button from "@/components/ui/button";
import Card from "@/components/ui/card";
import { formatDay } from "@/lib/format";
import { formatSignedKr } from "@/lib/money";
import type { MonthlyPaymentRow } from "@/types/monthlyPayment";
import TagChip from "./TagChip";

interface MonthlyPaymentsProps {
  payments: MonthlyPaymentRow[];
  onStop: (payment: MonthlyPaymentRow) => void;
}

/** The active monthly payments. Left out when there are none. */
export default function MonthlyPayments({ payments, onStop }: MonthlyPaymentsProps) {
  if (payments.length === 0) return null;

  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="text-xs text-foreground/60">Repeats every month</p>
        <h2 className="font-heading text-xl font-semibold">Monthly payments</h2>
      </div>

      <ul aria-label="Monthly payments">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-start gap-3 border-t border-foreground/10 py-3 first:border-t-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">{payment.title}</p>
              <p className="truncate text-xs text-foreground/60">{payment.detail}</p>
              <p className="text-xs text-foreground/60">Next: {formatDay(payment.nextCharge)}</p>
              {payment.tags.length > 0 && (
                <ul aria-label="Tags" className="mt-1 flex flex-wrap gap-1">
                  {payment.tags.map((tag) => (
                    <li key={tag.id} className="max-w-full">
                      <TagChip tag={tag} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="font-mono text-sm">{formatSignedKr(payment.amount)}</span>
              <Button variant="ghost" size="sm" onClick={() => onStop(payment)} aria-label={`Stop ${payment.title}`}>
                Stop
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
