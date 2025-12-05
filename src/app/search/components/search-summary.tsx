import AccessFilter from "../components/access-filter";
import SourcesFilter from "../components/sources-flter";
import FileFilter from "../components/file-filter";
import { Fragment } from "react";
import { Separator } from "@/components/ui/separator";
import LastUpdatedFilter from "./last-updated-filter";

// This function generates random counts for the search summary for placeholder data
// It ensures that the total count is distributed evenly among the categories
// It uses a simple algorithm to generate the counts
// It is not a perfect distribution, but it is a good approximation
function getRandomCounts(total: number, numCategories: number): number[] {
  if (numCategories === 0) return [];
  if (numCategories === 1) return [total];

  const counts: number[] = new Array(numCategories).fill(0);
  let remaining = total;

  for (let i = 0; i < numCategories - 1; i++) {
    const maxForThisCategory = remaining - (numCategories - i - 1);
    const randomCount = Math.floor(Math.random() * (maxForThisCategory + 1));
    counts[i] = randomCount;
    remaining -= randomCount;
  }

  counts[numCategories - 1] = remaining;

  return counts;
}

export default function SearchSummary({ count }: { count: number }) {
  // Get placeholder counts for the search summary
  const accessCounts = getRandomCounts(count, 6);
  const sourceCounts = getRandomCounts(count, 2);
  const fileTypeCounts = getRandomCounts(count, 4);
  const lastUpdatedCounts = getRandomCounts(count, 3);

  return (
    <Fragment>
      <AccessFilter
        data={[
          {
            access: "public",
            count: accessCounts[0],
          },
          {
            access: "private-full-access",
            count: accessCounts[1],
          },
          {
            access: "private-restricted",
            count: accessCounts[2],
          },
          {
            access: "private-forbidden",
            count: accessCounts[3],
          },
          {
            access: "personal-restricted",
            count: accessCounts[4],
          },
          {
            access: "personal-forbidden",
            count: accessCounts[5],
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
              count: sourceCounts[0],
            },
            {
              source: "shared folder",
              count: sourceCounts[1],
            },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-md text-xs">
        <p className="text-muted-foreground">File Type</p>
        <FileFilter
          data={[
            {
              type: "pdf",
              count: fileTypeCounts[0],
            },
            {
              type: "pptx",
              count: fileTypeCounts[1],
            },
            {
              type: "docx",
              count: fileTypeCounts[2],
            },
            {
              type: "xlsx",
              count: fileTypeCounts[3],
            },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-md text-xs">
        <p className="text-muted-foreground">Last Updated</p>
        <LastUpdatedFilter
          data={[
            {
              type: "pastWeek",
              count: lastUpdatedCounts[0],
            },
            {
              type: "pastMonth",
              count: lastUpdatedCounts[1],
            },
            {
              type: "older",
              count: lastUpdatedCounts[2],
            },
          ]}
        />
      </div>
    </Fragment>
  );
}
