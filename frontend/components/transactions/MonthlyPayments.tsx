"use client";

import { Repeat } from "lucide-react";
import Button from "@/components/ui/button";
import { cardClass } from "@/components/ui/transactions/styles";
import { formatDay } from "@/lib/format";
import { formatOre } from "@/lib/money";
import type { MonthlyPayment } from "@/types/transaction";

interface MonthlyPaymentsProps {
  payments: MonthlyPayment[];
  onStop: (payment: MonthlyPayment) => void;
}

export default function MonthlyPayments({ payments, onStop }: MonthlyPaymentsProps) {
  return (
    <section className={cardClass} aria-labelledby="monthly-payments-title">
      <h2 id="monthly-payments-title" className="mb-2 flex items-center gap-2 text-sm font-medium">
        <Repeat size={15} className="text-accent" aria-hidden />
        Monthly payments
      </h2>

      {payments.length === 0 ? (
        <p className="text-sm text-foreground/60">
          Tick &quot;Repeat monthly&quot; on a transaction and it shows up here.
        </p>
      ) : (
        <ul>
          {payments.map((payment) => (
            <li
              key={payment.id}
              className="flex items-center gap-2 border-t border-foreground/10 py-2 first:border-t-0"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{payment.description ?? payment.category?.name ?? "Monthly payment"}</p>
                <p className="text-xs text-foreground/60">Next charge {formatDay(payment.nextCharge)}</p>
              </div>
              <span className="font-mono text-sm">{formatOre(payment.amount)}</span>
              <Button variant="ghost" size="sm" onClick={() => onStop(payment)}>
                Stop
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
