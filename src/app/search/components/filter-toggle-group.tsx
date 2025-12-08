"use client";

import { Toggle } from "@/components/ui/toggle";
import { ReactNode } from "react";

export type FilterItem<T extends string = string> = {
  value: T;
  count: number;
};

export default function FilterToggleGroup<T extends string>({
  items,
  labels,
  renderIcon,
  getKey = (item) => item.value,
  onValueChange,
  value,
}: {
  items: FilterItem<T>[];
  labels: Record<T, string>;
  renderIcon?: (value: T) => ReactNode;
  getKey?: (item: FilterItem<T>) => string;
  onValueChange?: (value: string | string[]) => void;
  value?: string | string[];
}) {
  // Check if an item is selected
  const isSelected = (itemValue: T): boolean => {
    if (!value) return false;
    if (typeof value === "string") {
      return value === itemValue;
    }
    return value.includes(itemValue);
  };

  const handleToggle = (itemValue: T) => {
    if (!onValueChange) return;

    if (typeof value === "string" || !value) {
      // Single selection: toggle on/off
      const newValue = value === itemValue ? "" : itemValue;
      onValueChange(newValue);
    } else {
      // Multiple selection: toggle in array
      const newValue = value.includes(itemValue)
        ? value.filter((v) => v !== itemValue)
        : [...value, itemValue];
      onValueChange(newValue);
    }
  };

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-2">
      {items.map((item) => {
        const selected = isSelected(item.value);
        return (
          <Toggle
            key={getKey(item)}
            pressed={selected}
            onPressedChange={() => handleToggle(item.value)}
            variant="outline"
            size="sm"
            className="group text-xs flex flex-row gap-1 items-center rounded-md border-0 bg-gray-100 text-slate-800 cursor-pointer hover:text-black data-[state=on]:bg-red-600 data-[state=on]:text-white transition-all duration-300">
            {renderIcon && renderIcon(item.value)}
            {labels[item.value]}
            <span className="font-semibold">
              {item.count.toLocaleString("id-ID")}
            </span>
          </Toggle>
        );
      })}
    </div>
  );
}
