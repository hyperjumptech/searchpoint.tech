import { Toggle } from "@/components/ui/toggle";
import { FolderIcon, GlobeIcon } from "lucide-react";

export type TSourcesFilter = {
  source: "sharepoint" | "local";
  count: number;
};

const sourcesLabels: Record<TSourcesFilter["source"], string> = {
  sharepoint: "SharePoint",
  local: "Local",
};

export default function SourcesFilter({ data }: { data: TSourcesFilter[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {data.map((item) => (
        <Toggle
          key={item.source}
          variant="outline"
          className="flex flex-row items-center text-sm rounded-md text-muted-foreground cursor-pointer hover:text-black data-[state=on]:bg-red-600 data-[state=on]:text-white transition-all duration-300">
          <RenderIcon source={item.source} />
          {sourcesLabels[item.source]}
          <span className="text-xs">({item.count})</span>
        </Toggle>
      ))}
    </div>
  );
}

const RenderIcon = ({ source }: { source: TSourcesFilter["source"] }) => {
  switch (source) {
    case "sharepoint":
      return <GlobeIcon />;
    case "local":
      return <FolderIcon />;
  }
};
