"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();

  if (!pagination) {
    return null;
  }

  const { offset, limit, total } = pagination;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage >= totalPages;

  const buildUrl = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    return `?${params.toString()}`;
  };

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
        disabled={isFirstPage}
        className="p-0 w-8 md:w-10 h-8 md:h-10 cursor-pointer"
        asChild>
        <a href={buildUrl(1)}>
          <ChevronsLeft className="w-4 h-4" />
        </a>
      </Button>
      <Button
        variant="secondary"
        disabled={isFirstPage}
        className="p-0 w-8 md:w-10 h-8 md:h-10 cursor-pointer"
        asChild>
        <a href={buildUrl(Math.max(1, currentPage - 1))}>
          <ChevronLeft className="w-4 h-4" />
        </a>
      </Button>
      {pageNumbers.map((pageNum) => (
        <Button
          key={`page-${pageNum}`}
          variant={pageNum === currentPage ? "default" : "secondary"}
          className="px-2 md:px-4 min-w-8 md:min-w-10 h-8 md:h-10 cursor-pointer"
          asChild>
          <a href={buildUrl(pageNum)}>{pageNum}</a>
        </Button>
      ))}
      <Button
        variant="secondary"
        disabled={isLastPage}
        className="p-0 w-8 md:w-10 h-8 md:h-10 cursor-pointer"
        asChild>
        <a href={buildUrl(Math.min(totalPages, currentPage + 1))}>
          <ChevronRight className="w-4 h-4" />
        </a>
      </Button>
      <Button
        variant="secondary"
        disabled={isLastPage}
        className="p-0 w-8 md:w-10 h-8 md:h-10 cursor-pointer"
        asChild>
        <a href={buildUrl(totalPages)}>
          <ChevronsRight className="w-4 h-4" />
        </a>
      </Button>
    </div>
  );
}
