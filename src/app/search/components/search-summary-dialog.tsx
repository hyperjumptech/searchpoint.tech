"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
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
        <DialogHeader>
          <DialogTitle>Search Summary for &quot;{query}&quot;</DialogTitle>
        </DialogHeader>
        <SearchSummary data={data} />
      </DialogContent>
    </Dialog>
  );
}
