"use client";

import OneDriveIcon from "@/components/icons/onedrive-source";
import OtherSourceIcon from "@/components/icons/shared-folder-source";
import FilterToggleGroup, { FilterItem } from "./filter-toggle-group";
import { useSearchParams } from "next/navigation";

export type TSourcesFilter = {
  source: "onedrive" | "shared folder";
  count: number;
};

const sourcesLabels: Record<TSourcesFilter["source"], string> = {
  onedrive: "SharePoint",
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
  const searchParams = useSearchParams();

  const items: FilterItem<TSourcesFilter["source"]>[] = data.map((item) => ({
    value: item.source,
    count: item.count,
  }));

  const currentSource = searchParams.get("sources");

  const handleValueChange = (value: string | string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    // For single selection, value is a string (or empty string if deselected)
    const selectedSource = typeof value === "string" ? value : value[0] || "";

    if (selectedSource && selectedSource !== currentSource) {
      // Set sources param
      params.set("sources", selectedSource);
    } else if (!selectedSource && currentSource) {
      // Remove sources param
      params.delete("sources");
    }

    // Reset to page 1 when filter changes
    params.set("page", "1");
    window.location.href = `?${params.toString()}`;
  };

  return (
    <FilterToggleGroup
      items={items}
      labels={sourcesLabels}
      renderIcon={renderIcon}
      value={currentSource || undefined}
      onValueChange={handleValueChange}
    />
  );
}
