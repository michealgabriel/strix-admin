import { AlertCircle, Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import EmptyState from "./EmptyState";
import Pagination from "./Pagination";

/**
 * A server-driven table.
 *   columns: [{ key, header, cell?: (row) => node, className? }]
 *   rows, isLoading, isFetching, error, onRetry
 *   pagination: { page, totalPages, total, onPageChange }
 *   onRowClick: (row) => void
 */
export default function DataTable({
  columns,
  rows = [],
  isLoading,
  isFetching,
  error,
  onRetry,
  pagination,
  onRowClick,
  rowKey = (row) => row.id,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  toolbar,
}) {
  return (
    <div className="space-y-4">
      {toolbar && <div className="flex flex-col gap-2 sm:flex-row sm:items-center">{toolbar}</div>}

      <div className={cn("overflow-hidden rounded-xl border bg-card", isFetching && !isLoading && "opacity-70")}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              {columns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i}>
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      <Skeleton className="h-5 w-full max-w-40" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}

            {!isLoading &&
              !error &&
              rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? "cursor-pointer" : undefined}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className={column.className}>
                      {column.cell ? column.cell(row) : (row[column.key] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {!isLoading && error && (
          <EmptyState icon={AlertCircle} title="Couldn't load this list" description={errorMessage(error)}>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            )}
          </EmptyState>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
        )}
      </div>

      {pagination && !error && <Pagination {...pagination} />}
    </div>
  );
}
