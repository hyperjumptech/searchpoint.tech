"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { SearchPagination } from "@/actions/search";

type PaginationButtonsProps = {
  pagination: SearchPagination;
  maxPageButtons?: number;
};

export default function PaginationButtons({
  pagination,
  maxPageButtons = 5,
}: PaginationButtonsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (!pagination) {
    return null;
  }

  const { offset, limit, total } = pagination;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages;

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const handleFirstPage = () => updatePage(1);
  const handlePreviousPage = () => updatePage(Math.max(1, currentPage - 1));
  const handleNextPage = () =>
    updatePage(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => updatePage(totalPages);
  const handlePageChange = (newPage: number) => updatePage(newPage);

  const getPageNumbers = () => {
    if (totalPages === 0) return [];

    const pages: number[] = [];
    const halfWindow = Math.floor(maxPageButtons / 2);

    let startPage = Math.max(1, currentPage - halfWindow);
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    if (endPage - startPage + 1 < maxPageButtons) {
      startPage = Math.max(1, endPage - maxPageButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center space-x-2 md:space-x-4">
      <Button
        variant="secondary"
        onClick={handleFirstPage}
        disabled={isFirstPage}
        className="cursor-pointer h-8 w-8 p-0 md:h-10 md:w-10">
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        onClick={handlePreviousPage}
        disabled={isFirstPage}
        className="cursor-pointer h-8 w-8 p-0 md:h-10 md:w-10">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {pageNumbers.map((pageNum) => (
        <Button
          key={`page-${pageNum}`}
          variant={pageNum === currentPage ? "default" : "secondary"}
          onClick={() => handlePageChange(pageNum)}
          className="cursor-pointer h-8 min-w-8 px-2 md:h-10 md:min-w-10 md:px-4">
          {pageNum}
        </Button>
      ))}
      <Button
        variant="secondary"
        onClick={handleNextPage}
        disabled={isLastPage}
        className="cursor-pointer h-8 w-8 p-0 md:h-10 md:w-10">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Button
        variant="secondary"
        onClick={handleLastPage}
        disabled={isLastPage}
        className="cursor-pointer h-8 w-8 p-0 md:h-10 md:w-10">
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
