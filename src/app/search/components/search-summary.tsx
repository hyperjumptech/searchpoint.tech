import SourcesFilter from "../components/sources-flter";
import { Fragment } from "react";
import { Separator } from "@/components/ui/separator";
import { FileAccessMeta, FileSourceMeta } from "@/actions/search";
import AccessFilterSimple from "./access-filter-simple";

export default function SearchSummary({
  meta,
}: {
  count: number;
  meta: {
    accessMeta: FileAccessMeta;
    sourceMeta: FileSourceMeta;
  };
}) {
  return (
    <Fragment>
      <AccessFilterSimple
        data={[
          {
            access: "allowed",
            count: meta.accessMeta.allowed || 0,
          },
          {
            access: "not_allowed",
            count: meta.accessMeta.not_allowed || 0,
          },
        ]}
      />
      <Separator />
      <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-md text-xs">
        <p className="text-muted-foreground">Sources</p>
        <SourcesFilter
          data={[
            {
              source: "onedrive",
              count: meta.sourceMeta.onedrive || 0,
            },
            {
              source: "shared folder",
              count: meta.sourceMeta.shared_folder || 0,
            },
          ]}
        />
      </div>
    </Fragment>
  );
}
