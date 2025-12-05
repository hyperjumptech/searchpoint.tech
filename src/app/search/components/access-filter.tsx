import {
  accessLabels,
  RenderIcon,
  TAccessFilter,
} from "@/components/access-badge";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";

export default function AccessFilter({ data }: { data: TAccessFilter[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((item) => (
        <Toggle
          key={item.access}
          variant="outline"
          className="group flex flex-row items-center gap-1 text-xs rounded-md text-black cursor-pointer hover:text-black data-[state=on]:bg-red-600 data-[state=on]:text-white transition-all duration-300">
          <RenderIcon access={item.access} />
          {accessLabels[item.access]}
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-400 font-semibold border-0 text-xs rounded-sm px-1 py-0.5 group-data-[state=on]:bg-transparent group-data-[state=on]:text-white">
            {item.count}
          </Badge>
        </Toggle>
      ))}
    </div>
  );
}
