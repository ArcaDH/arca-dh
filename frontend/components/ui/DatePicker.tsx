"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, type FC } from "react";
import { DayPicker } from "react-day-picker";
import { Dropdown } from "@/components/ui/Dropdown";
import { formatDate, toISODate } from "@/lib/format";

const toDate = (date: string) => new Date(`${date}T00:00:00`);

const navButton =
  "flex size-7 cursor-pointer items-center justify-center rounded-md border border-foreground/10 text-foreground/70 hover:bg-foreground/5 aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-transparent";

interface DatePickerProps {
  label: string;
  value: string; // "YYYY-MM-DD" or ""
  min?: string;
  placeholder?: string;
  onChange: (date: string) => void;
}

export const DatePicker: FC<DatePickerProps> = ({ label, value, min, placeholder = "Pick a date", onChange }) => {
  const [shownMonth, setShownMonth] = useState(toDate(value || toISODate(new Date())));
  const [syncedValue, setSyncedValue] = useState(value);
  const fromDate = min ? toDate(min) : new Date();

  // Jump to the picked date's month when the value changes from outside
  if (value !== syncedValue) {
    setSyncedValue(value);
    setShownMonth(toDate(value || toISODate(new Date())));
  }

  return (
    <Dropdown
      label={`${label}, ${value ? formatDate(value) : "no date picked"}`}
      triggerClassName="flex h-[38px] w-full items-center gap-2 rounded-lg border border-foreground/20 bg-white px-3 text-left text-sm transition-colors hover:bg-foreground/[0.02] aria-expanded:border-primary aria-expanded:ring-2 aria-expanded:ring-primary/20"
      trigger={
        <>
          <CalendarDays size={15} className="shrink-0 text-muted" aria-hidden />
          <span className={value ? "tabular-nums" : "text-foreground/40"}>
            {value ? formatDate(value) : placeholder}
          </span>
        </>
      }
    >
      {(close) => (
        <DayPicker
          mode="single"
          required={false}
          selected={value ? toDate(value) : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange(toISODate(date));
            close();
          }}
          month={shownMonth}
          onMonthChange={setShownMonth}
          disabled={{ before: fromDate }}
          startMonth={fromDate}
          endMonth={new Date(fromDate.getFullYear() + 30, 11)}
          captionLayout="dropdown"
          weekStartsOn={1}
          showOutsideDays
          components={{
            Chevron: ({ orientation }) =>
              orientation === "left" ? (
                <ChevronLeft size={15} aria-hidden />
              ) : orientation === "right" ? (
                <ChevronRight size={15} aria-hidden />
              ) : (
                <ChevronDown size={13} className="text-muted" aria-hidden />
              ),
          }}
          classNames={{
            root: "relative p-2 text-sm",
            months: "relative",
            nav: "absolute top-2 right-2 z-10 flex gap-1",
            button_previous: navButton,
            button_next: navButton,
            month_caption: "mb-2 flex h-7 items-center",
            dropdowns: "flex items-center gap-1",
            dropdown_root:
              "relative inline-flex items-center rounded-md px-1.5 py-0.5 font-medium hover:bg-foreground/5 has-focus-visible:ring-2 has-focus-visible:ring-primary/30",
            dropdown: "absolute inset-0 cursor-pointer opacity-0",
            caption_label: "flex items-center gap-1",
            month_grid: "border-collapse",
            weekdays: "",
            weekday: "pb-1 text-xs font-normal text-muted",
            week: "",
            day: "p-0.5 text-center",
            day_button:
              "size-8 cursor-pointer rounded-md tabular-nums transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-inherit",
            selected: "[&>button]:bg-primary [&>button]:font-medium [&>button]:text-white [&>button]:hover:bg-primary",
            today: "[&>button]:bg-foreground/5 [&>button]:font-medium",
            outside: "text-foreground/35",
            disabled: "opacity-30",
          }}
        />
      )}
    </Dropdown>
  );
};
