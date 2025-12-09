import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import SearchSummaryView from "./view";
import { FileAccessMeta, FileSourceMeta } from "@/actions/search";

export default function SearchSummarySidebar({
  query,
  total,
  meta,
}: {
  query: string;
  total: number;
  meta: {
    accessMeta: FileAccessMeta;
    sourceMeta: FileSourceMeta;
  };
}) {
  return (
    <Card className="w-full py-0 max-w-none xl:max-w-sm h-max gap-0 bg-gray-50/30 shadow-accent-foregroundmd">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-semibold">
          Search Summary -{" "}
          <span className="font-semibold italic">&quot;{query}&quot;</span>
        </CardTitle>
        <CardDescription className="text-gray-500 font-light text-sm">
          {total.toLocaleString("id-ID")} document(s) found
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4 pb-4 w-full">
        <SearchSummaryView meta={meta} />
      </CardContent>
    </Card>
  );
}
