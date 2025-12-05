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

type SearchSummaryDialogProps = {
  open: boolean;
  query: string;
  data: {
    pagination: {
      total: number;
    };
  };
};

export default function SearchSummaryDialog({
  open,
  query,
  data,
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="flex flex-col gap-0 pb-2">
          <DialogTitle className="text-lg font-semibold text-left">
            Search Summary -{" "}
            <span className="font-semibold italic">&quot;{query}&quot;</span>
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-light text-sm text-left">
            {data.pagination.total} document(s) found
          </DialogDescription>
        </DialogHeader>
        <SearchSummary count={data.pagination.total} />
      </DialogContent>
    </Dialog>
  );
}
