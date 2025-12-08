"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SearchSummary from "./search-summary";
import { FileAccessMeta, FileSourceMeta } from "@/actions/search";

type SearchSummaryDialogProps = {
  open: boolean;
  query: string;
  data: {
    pagination: {
      total: number;
    };
  };
  meta: {
    accessMeta: FileAccessMeta;
    sourceMeta: FileSourceMeta;
  };
};

export default function SearchSummaryDialog({
  open,
  query,
  data,
  meta,
}: SearchSummaryDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("summary");
      router.push(`/search?${params.toString()}`);
    }
  };

  // TODO: Do not calculate total documents
  const totalDocuments =
    (meta.accessMeta.allowed || 0) + (meta.accessMeta.not_allowed || 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-col gap-0 pb-2">
          <DialogTitle className="text-lg font-semibold text-left">
            Search Summary -{" "}
            <span className="font-semibold italic">&quot;{query}&quot;</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-light text-sm text-left">
            {totalDocuments.toLocaleString("id-ID")} document(s) found
          </DialogDescription>
        </DialogHeader>
        <SearchSummary count={totalDocuments} meta={meta} />
      </DialogContent>
    </Dialog>
  );
}
