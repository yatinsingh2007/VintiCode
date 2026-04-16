"use client";

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

interface DashboardPaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const DashboardPagination: React.FC<DashboardPaginationProps> = ({
  totalPages,
  currentPage,
  onPageChange,
}) => {
  // Show only first 10 pages (or fewer if totalPages < 10)
  const pages = Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1);

  return (
    <Pagination>
      <PaginationPrevious
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        className="bg-card text-card-foreground border border-border cursor-pointer hover:bg-muted transition-colors"
      >
        Prev
      </PaginationPrevious>
 
       <PaginationContent>
         {pages.map((page) => (
           <PaginationItem key={page}>
             <PaginationLink
               onClick={() => onPageChange(page)}
               className={`px-4 mx-0.5 py-1 rounded transition-colors ${
                 page === currentPage
                   ? "bg-primary text-primary-foreground font-semibold shadow-md"
                   : "bg-card text-card-foreground border border-border cursor-pointer hover:bg-muted"
               }`}
             >
               {page}
             </PaginationLink>
           </PaginationItem>
         ))}
 
         {totalPages > 10 && (
           <PaginationEllipsis className="text-muted-foreground select-none" />
         )}
       </PaginationContent>
 
       <PaginationNext
         onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
         className="bg-card text-card-foreground border border-border cursor-pointer hover:bg-muted transition-colors"
       >
         Next
       </PaginationNext>
     </Pagination>
  );
};

export default DashboardPagination;

