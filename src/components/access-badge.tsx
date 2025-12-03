import { Badge } from "@/components/ui/badge";
import { getMe } from "@/actions/me";
import { TFile } from "../types";

export default async function AccessBadge({ file }: { file: TFile }) {
  const user = await getMe();
  const { allowList, ownerEmail, fileSource } = file;

  const determineAccess = () => {
    if (fileSource === "onedrive") {
      if (allowList.includes(user?.email ?? "") || user?.email === ownerEmail) {
        return "Private - Full Access";
      }

      return "Private - Forbidden";
    }

    return "Private - Restricted";
  };

  return (
    <Badge variant="outline" className="text-xs shrink-0">
      {determineAccess()}
    </Badge>
  );
}
