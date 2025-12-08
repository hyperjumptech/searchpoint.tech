import { Toggle } from "@/components/ui/toggle";
import { ReactNode } from "react";

export type FilterItem<T extends string = string> = {
  value: T;
  count: number;
};

type FilterToggleGroupProps<T extends string> = {
  items: FilterItem<T>[];
  labels: Record<T, string>;
  renderIcon?: (value: T) => ReactNode;
  getKey?: (item: FilterItem<T>) => string;
};

export default function FilterToggleGroup<T extends string>({
  items,
  labels,
  renderIcon,
  getKey = (item) => item.value,
}: FilterToggleGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-x-2 gap-y-2">
      {items.map((item) => (
        <Toggle
          key={getKey(item)}
          variant="outline"
          size="sm"
          className="group text-xs flex flex-row gap-1 items-center rounded-md border-0 bg-gray-100 text-slate-800 cursor-pointer hover:text-black data-[state=on]:bg-red-600 data-[state=on]:text-white transition-all duration-300">
          {renderIcon && renderIcon(item.value)}
          {labels[item.value]}
          <span className="font-semibold">
            {item.count.toLocaleString("id-ID")}
          </span>
        </Toggle>
      ))}
    </div>
  );
}
