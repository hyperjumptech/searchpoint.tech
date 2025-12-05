import OneDriveIcon from "@/components/icons/onedrive-source";
import OtherSourceIcon from "@/components/icons/other-source";
import FilterToggleGroup, { FilterItem } from "./filter-toggle-group";

export type TSourcesFilter = {
  source: "onedrive" | "shared folder";
  count: number;
};

const sourcesLabels: Record<TSourcesFilter["source"], string> = {
  onedrive: "OneDrive",
  "shared folder": "Shared Folder",
};

const renderIcon = (source: TSourcesFilter["source"]) => {
  switch (source) {
    case "onedrive":
      return <OneDriveIcon />;
    case "shared folder":
      return <OtherSourceIcon />;
  }
};

export default function SourcesFilter({ data }: { data: TSourcesFilter[] }) {
  const items: FilterItem<TSourcesFilter["source"]>[] = data.map((item) => ({
    value: item.source,
    count: item.count,
  }));

  return (
    <FilterToggleGroup
      items={items}
      labels={sourcesLabels}
      renderIcon={renderIcon}
    />
  );
}
