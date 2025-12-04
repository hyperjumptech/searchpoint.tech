import AccessFilter from "../components/access-filter";
import SourcesFilter from "../components/sources-flter";
import FileFilter from "../components/file-filter";
import { Fragment } from "react";

export default function SearchSummary({
  data,
}: {
  data: {
    pagination: {
      total: number;
    };
  };
}) {
  return (
    <Fragment>
      <p className="text-sm text-muted-foreground">
        {data.pagination.total} document(s) found
      </p>
      <AccessFilter
        data={[
          {
            access: "private-full-access",
            count: 10,
          },
          {
            access: "private-restricted",
            count: 3,
          },
          {
            access: "private-forbidden",
            count: 3,
          },
        ]}
      />
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Sources:</p>
        <SourcesFilter
          data={[
            {
              source: "sharepoint",
              count: 10,
            },
            {
              source: "local",
              count: 10,
            },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">File Type:</p>
        <FileFilter
          data={[
            {
              type: "all",
              count: 10,
            },
            {
              type: "office",
              count: 10,
            },
            {
              type: "pdf",
              count: 10,
            },
            {
              type: "images",
              count: 10,
            },
          ]}
        />
      </div>
    </Fragment>
  );
}
