"use client";

import { ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { useState, type FC } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import IconButton from "@/components/ui/IconButton";
import { currentMonth, shiftMonth } from "@/lib/format";

const MONTH_NAMES = Array.from({ length: 12 }, (_, index) =>
  new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(2000, index, 1)),
);

const longMonth = (month: string) =>
  new Intl.DateTimeFormat("en-GB", { month: "long" }).format(new Date(`${month}-01T00:00:00`));

const shortMonth = (month: string) => MONTH_NAMES[Number(month.slice(5, 7)) - 1];

const toMonth = (year: number, monthIndex: number) => `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

interface MonthPickerProps {
  month: string;
  onChange: (month: string) => void;
}

export const MonthPicker: FC<MonthPickerProps> = ({ month, onChange }) => {
  const year = Number(month.slice(0, 4));
  const [gridYear, setGridYear] = useState(year);
  const today = currentMonth();

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        label={`Choose month, now ${longMonth(month)} ${year}`}
        triggerClassName="group -ml-2 flex items-center gap-1.5 rounded-lg px-2 py-1 text-left hover:bg-foreground/5"
        trigger={
          <>
            <span className="text-lg font-semibold tabular-nums">
              {shortMonth(month)}, {year}
            </span>
            <ChevronUp
              size={18}
              strokeWidth={3}
              className="shrink-0 text-primary transition-transform group-aria-expanded:rotate-180"
              aria-hidden
            />
          </>
        }
      >
        {(close) => (
          <div className="p-2">
            <div className="mb-2 flex items-center justify-between">
              <IconButton aria-label="Previous year" onClick={() => setGridYear((shown) => shown - 1)}>
                <ChevronLeft size={16} aria-hidden />
              </IconButton>
              <span className="font-heading font-semibold">{gridYear}</span>
              <IconButton aria-label="Next year" onClick={() => setGridYear((shown) => shown + 1)}>
                <ChevronRight size={16} aria-hidden />
              </IconButton>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {MONTH_NAMES.map((name, index) => {
                const value = toMonth(gridYear, index);
                const isSelected = value === month;
                const isToday = value === today;
                return (
                  <button
                    key={name}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    onClick={() => {
                      onChange(value);
                      close();
                    }}
                    className={`relative cursor-pointer rounded-lg py-2 text-sm transition-colors ${
                      isSelected
                        ? "bg-primary font-semibold text-white"
                        : "text-foreground/80 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {name}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary" />
                    )}
                  </button>
                );
              })}
            </div>
            {month !== today && (
              <button
                type="button"
                onClick={() => {
                  onChange(today);
                  setGridYear(Number(today.slice(0, 4)));
                  close();
                }}
                className="mt-2 w-full cursor-pointer rounded-lg py-1.5 text-sm text-primary hover:bg-primary/10"
              >
                Jump to this month
              </button>
            )}
          </div>
        )}
      </Dropdown>

      <div className="flex items-center">
        <IconButton
          aria-label="Previous month"
          className="rounded-md"
          onClick={() => {
            const previous = shiftMonth(month, -1);
            onChange(previous);
            setGridYear(Number(previous.slice(0, 4)));
          }}
        >
          <ChevronLeft size={16} aria-hidden />
        </IconButton>
        <IconButton
          aria-label="Next month"
          className="rounded-md"
          onClick={() => {
            const next = shiftMonth(month, 1);
            onChange(next);
            setGridYear(Number(next.slice(0, 4)));
          }}
        >
          <ChevronRight size={16} aria-hidden />
        </IconButton>
      </div>
    </div>
  );
};
