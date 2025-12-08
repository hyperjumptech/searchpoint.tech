import { getMe } from "@/actions/me";
import { Badge } from "@/components/ui/badge";
import { TFile } from "../../types";
import {
  BanIcon,
  GlobeIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from "lucide-react";
import { TAccessFilter } from "./types";
import { accessLabels } from "./types";
import AccessTooltip from "./access-tooltip";

type Props = {
  file: TFile;
};

export default async function AccessBadge({ file }: Props) {
  const user = await getMe();
  const { allowList, ownerEmail, fileSource } = file;

  const determineAccess = (): TAccessFilter["access"] => {
    if (fileSource === "onedrive") {
      if (user?.email === ownerEmail) {
        return "private-full-access";
      } else if (allowList.includes(user?.email || "")) {
        return "private-restricted";
      } else {
        return "private-forbidden";
      }
    } else {
      if (user?.email === ownerEmail) {
        return "personal-restricted";
      } else {
        return "personal-forbidden";
      }
    }
  };

  const access = determineAccess();

  return (
    <AccessTooltip access={access}>
      <Badge
        variant="outline"
        className="cursor-default! text-[11px] shrink-0 text-muted-foreground gap-1">
        <RenderIcon access={access} />
        {accessLabels[access]}
      </Badge>
    </AccessTooltip>
  );
}

export const RenderIcon = ({ access }: { access: TAccessFilter["access"] }) => {
  switch (access) {
    case "public":
      return <GlobeIcon className="text-[#3593EA]" />;
    case "private-full-access":
      return <ShieldCheckIcon className="text-[#4CAF50]" />;
    case "private-restricted":
      return <ShieldAlertIcon className="text-[#EB7F22]" />;
    case "private-forbidden":
      return <BanIcon className="text-[#CB3635]" />;
    case "personal-restricted":
      return <UserRoundCheckIcon className="text-[#EB7F22]" />;
    case "personal-forbidden":
      return <UserRoundXIcon className="text-[#CB3635]" />;
  }
};
