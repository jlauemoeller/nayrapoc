import { Decision } from "@/lib/models/decision";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext
} from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { DecisionStateBadge } from "./decision-state-badge";

type DecisionTableProps = {
  decisions: Decision<"with-creator">[];
  page: number;
  hasNextPage: boolean;
  total?: number;
};

export function DecisionTable({ decisions, page, hasNextPage, total }: DecisionTableProps) {
  return (
    <div className="flex flex-col items-end gap-4">
      <div className="border rounded-lg w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-50">Decision</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>State</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decisions.map((decision) => (
              <TableRow key={decision.id} className="relative">
                <TableCell className="font-medium">
                  <Link href={`/decisions/${decision.id}`} className="after:absolute after:inset-0">
                    {decision.title}
                  </Link>
                </TableCell>
                <TableCell>
                  {decision.creator.firstName} {decision.creator.lastName}
                </TableCell>
                <TableCell>
                  {decision.reviewBy ?
                    "Needs review"
                  : decision.reviewedAt ?
                    "Reviewed"
                  : "Never reviewed"}
                </TableCell>
                <TableCell>
                  <DecisionStateBadge decision={decision} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-row gap-4 items-center">
        {total && <span className="text-sm">{total} decision(s) total</span>}
        <Pagination className="mx-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={`?page=${page - 1}`}
                aria-disabled={page === 1}
                className={page === 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href={`?page=${page + 1}`}
                aria-disabled={!hasNextPage}
                className={!hasNextPage ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
