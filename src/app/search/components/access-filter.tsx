import Image from "next/image";

import { Toggle } from "@/components/ui/toggle";

export type TAccessFilter = {
  access: "private-full-access" | "private-restricted" | "private-forbidden";
  count: number;
};

const accessLabels: Record<TAccessFilter["access"], string> = {
  "private-full-access": "Private - Full Access",
  "private-restricted": "Private - Restricted",
  "private-forbidden": "Private - Forbidden",
};

const accessIcons: Record<
  TAccessFilter["access"],
  { iconPath: string; svgColor: string }
> = {
  "private-full-access": {
    iconPath: "/images/private-full-access.svg",
    svgColor:
      "invert(48%) sepia(79%) saturate(1800%) hue-rotate(86deg) brightness(90%) contrast(119%)",
  },
  "private-restricted": {
    iconPath: "/images/restricted-access.svg",
    svgColor:
      "invert(69%) sepia(54%) saturate(280%) hue-rotate(8deg) brightness(88%) contrast(101%)",
  },
  "private-forbidden": {
    iconPath: "/images/forbidden-access.svg",
    svgColor:
      "invert(27%) sepia(51%) saturate(2200%) hue-rotate(346deg) brightness(85%) contrast(97%)",
  },
};

export default function AccessFilter({ data }: { data: TAccessFilter[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((item) => (
        <Toggle
          key={item.access}
          variant="outline"
          className="group flex flex-row items-center text-sm rounded-md text-muted-foreground cursor-pointer hover:text-black data-[state=on]:bg-red-600 data-[state=on]:text-white transition-all duration-300">
          <RenderIcon access={item.access} />
          {accessLabels[item.access]}
          <span className="text-xs">({item.count})</span>
        </Toggle>
      ))}
    </div>
  );
}

const RenderIcon = ({ access }: { access: TAccessFilter["access"] }) => {
  const icon = accessIcons[access];

  return (
    <Image
      width={14}
      height={14}
      alt={accessLabels[access]}
      src={icon.iconPath}
      style={{ filter: icon.svgColor }}
      className="group-data-[state=on]:brightness-0 group-data-[state=on]:invert"
    />
  );
};
