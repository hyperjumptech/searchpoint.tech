import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CircleIcon } from "lucide-react";

export default function AccessFilterSimple({
  data,
}: {
  data: {
    access: "allowed" | "not_allowed";
    count: number;
  }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((item) => (
        <Badge
          key={item.access}
          variant="secondary"
          className="bg-muted justify-center font-medium whitespace-nowrap border-input shadow-xs hover:bg-accent h-8 px-1.5 min-w-8 group text-xs flex flex-row gap-1 items-center rounded-md border-0 text-slate-800 hover:text-black transition-all duration-300">
          <CircleIcon
            className={cn(
              "w-2 h-2 p-0.5 aspect-square",
              item.access === "allowed" && "fill-green-500 text-green-500",
              item.access === "not_allowed" && "fill-red-500 text-red-500",
            )}
          />
          <span>
            {item.access === "allowed" ? "Full Access/Restricted" : "Forbidden"}
          </span>
          <Badge
            variant="secondary"
            className="bg-blue-50 text-blue-400 font-semibold border-0 text-xs rounded-sm px-1 py-0.5 group-data-[state=on]:bg-transparent group-data-[state=on]:text-blue-400">
            {item.count.toLocaleString("id-ID")}
          </Badge>
        </Badge>
      ))}
    </div>
  );
}
