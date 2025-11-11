"use client";

import { format, addDays, startOfDay } from "date-fns";

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  // Generate next 7 days
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfDay(new Date()), i));

  return (
    <div className="w-full px-6 py-6">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide sm:justify-center pl-1 pr-1 sm:pl-0 sm:pr-0 items-center py-2">
        {days.map((day) => {
          const isSelected = format(day, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateChange(day)}
              className={`
                flex flex-col items-center justify-center flex-shrink-0 w-[85px] h-[100px] px-4 rounded-lg border-2 transition-all shadow-sm
                ${isSelected
                  ? "border-primary bg-primary/10 text-primary shadow-md"
                  : "border-border bg-card text-foreground hover:border-primary/50 hover:shadow"
                }
              `}
            >
              <span className="text-xs font-medium uppercase">
                {format(day, "EEE")}
              </span>
              <span className="text-2xl font-bold mt-1">
                {format(day, "d")}
              </span>
              <span className="text-xs mt-1">
                {format(day, "MMM")}
              </span>
              {isToday && (
                <span className="text-xs font-semibold text-primary mt-1">
                  Today
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
