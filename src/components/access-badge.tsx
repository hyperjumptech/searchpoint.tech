import { getMe } from "@/actions/me";
import { Badge } from "@/components/ui/badge";
import { TFile } from "../types";
import {
  BanIcon,
  GlobeIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
  UserRoundXIcon,
} from "lucide-react";

type Props = {
  file: TFile;
};

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

export const accessLabels: Record<TAccessFilter["access"], string> = {
  public: "Public",
  "private-full-access": "Private: Full Access",
  "private-restricted": "Private: Restricted",
  "private-forbidden": "Private: Forbidden",
  "personal-restricted": "Personal: Restricted",
  "personal-forbidden": "Personal: Forbidden",
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
    <Badge
      variant="outline"
      className="text-[11px] shrink-0 text-muted-foreground gap-1">
      <RenderIcon access={access} />
      {accessLabels[access]}
    </Badge>
  );
}

export const RenderIcon = ({ access }: { access: TAccessFilter["access"] }) => {
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
