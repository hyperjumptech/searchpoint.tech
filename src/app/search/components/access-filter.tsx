import { accessLabels, TAccessFilter } from "@/components/access/types";
import { RenderIcon } from "@/components/access/access-badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AccessTooltip from "@/components/access/access-tooltip";
import { Badge } from "@/components/ui/badge";

export default function AccessFilter({
  data,
  type = "multiple",
}: {
  data: TAccessFilter[];
  type?: "multiple" | "single";
}) {
  return (
    <ToggleGroup type={type} className="flex flex-wrap" spacing={2}>
      {data
        .sort((a, b) => b.count - a.count)
        .map((item) => (
          <AccessToggle
            key={item.access}
            access={item.access}
            count={item.count}
          />
        ))}
    </ToggleGroup>
  );
}

function AccessToggle({
  access,
  count,
}: {
  access: TAccessFilter["access"];
  count: number;
}) {
  return (
    <ToggleGroupItem
      value={access}
      className="cursor-default group text-xs flex flex-row gap-1 items-center rounded-md border-0 bg-gray-100 text-slate-800 hover:text-black hover:bg-gray-100 data-[state=on]:bg-gray-100 data-[state=on]:text-slate-800 transition-all duration-300">
      <AccessTooltip access={access}>
        <div className="flex flex-row gap-1 items-center">
          <RenderIcon access={access} />
          {accessLabels[access]}
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-400 font-semibold border-0 text-xs rounded-sm px-1 py-0.5 group-data-[state=on]:bg-transparent group-data-[state=on]:text-blue-400">
            {count}
          </Badge>
        </div>
      </AccessTooltip>
    </ToggleGroupItem>
  );
}
