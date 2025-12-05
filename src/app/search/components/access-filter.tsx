import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import {
  BanIcon,
  GlobeIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from "lucide-react";

export type TAccessFilter = {
  access:
    | "public"
    | "private-full-access"
    | "private-restricted"
    | "private-forbidden"
    | "personal-restricted"
    | "personal-forbidden";
  count: number;
};

const accessLabels: Record<TAccessFilter["access"], string> = {
  public: "Public",
  "private-full-access": "Private: Full Access",
  "private-restricted": "Private: Restricted",
  "private-forbidden": "Private: Forbidden",
  "personal-restricted": "Personal: Restricted",
  "personal-forbidden": "Personal: Forbidden",
};

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

const RenderIcon = ({ access }: { access: TAccessFilter["access"] }) => {
  switch (access) {
    case "public":
      return <GlobeIcon className="text-green-400" />;
    case "private-full-access":
      return <ShieldCheckIcon className="text-green-400" />;
    case "private-restricted":
      return <ShieldAlertIcon className="text-yellow-400" />;
    case "private-forbidden":
      return <BanIcon className="text-red-400" />;
    case "personal-restricted":
      return <UserRoundCheckIcon className="text-yellow-400" />;
    case "personal-forbidden":
      return <UserRoundXIcon className="text-red-400" />;
  }
};
