import Image from "next/image";

import { getMe } from "@/actions/me";
import { Badge } from "@/components/ui/badge";

import { TFile } from "../types";

type Props = {
  file: TFile;
};

export default async function AccessBadge({ file }: Props) {
  const user = await getMe();
  const { allowList, ownerEmail, fileSource } = file;

  const determineAccess = () => {
    if (fileSource === "onedrive") {
      if (allowList.includes(user?.email ?? "") || user?.email === ownerEmail) {
        return {
          color: "text-green-500",
          title: "Private: Full Access",
          iconPath: "/images/private-full-access.svg",
          svgColor:
            "invert(48%) sepia(79%) saturate(1800%) hue-rotate(86deg) brightness(90%) contrast(119%)",
        };
      }

      return {
        color: "text-red-500",
        title: "Private: Forbidden",
        iconPath: "/images/forbidden-access.svg",
        svgColor:
          "invert(27%) sepia(51%) saturate(2200%) hue-rotate(346deg) brightness(85%) contrast(97%)",
      };
    }

    return {
      color: "text-yellow-500",
      title: "Private: Restricted",
      iconPath: "/images/restricted-access.svg",
      svgColor:
        "invert(69%) sepia(54%) saturate(280%) hue-rotate(8deg) brightness(88%) contrast(101%)",
    };
  };

  const access = determineAccess();

  return (
    <Badge
      variant="outline"
      className="text-[10px] shrink-0 text-muted-foreground">
      <Image
        width={14}
        height={14}
        alt={access.title}
        src={access.iconPath}
        style={{ filter: access.svgColor }}
      />
      {access.title}
    </Badge>
  );
}
