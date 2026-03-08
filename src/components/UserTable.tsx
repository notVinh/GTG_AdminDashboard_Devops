import { useState, useMemo } from 'react';
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Search, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
// import { format } from 'date-fns';
import type { User as UserType } from '../types';
import { cn } from '../lib/utils';

interface UserTableProps {
  data: UserType[];
  columns: Array<{
    key: string;
    label: string;
    render: (user: UserType) => React.ReactNode;
  }>;
  searchKey: string;
  searchPlaceholder: string;
  onCreate?: () => void;
  getRowClass?: (row: UserType) => string;
}

export default function UserTable({ data, columns, searchPlaceholder, getRowClass }: UserTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  const tableColumns = useMemo<ColumnDef<UserType>[]>(
    () => [
      // {
      //   id: 'select',
      //   header: ({ table }) => (
      //     <input
      //       type="checkbox"
      //       checked={table.getIsAllPageRowsSelected()}
      //       onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
      //       className="h-4 w-4 rounded border-border text-primary focus:ring-ring accent-primary"
      //     />
      //   ),
      //   cell: ({ row }) => (
      //     <input
      //       type="checkbox"
      //       checked={row.getIsSelected()}
      //       onChange={(e) => row.toggleSelected(e.target.checked)}
      //       className="h-4 w-4 rounded border-border text-primary focus:ring-ring accent-primary"
      //     />
      //   ),
      //   size: 40,
      //   meta: {
      //     hideOnMobile: true,
      //   },
      // },
      ...columns.map(col => ({
        id: col.key,
        header: ({ column }: { column: any }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            {col.label}
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }: { row: any }) => col.render(row.original),
        meta: {
          hideOnMobile: col.key === 'department' || col.key === 'actions',
        },
      })),
    ],
    [columns]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Lọc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block sm:hidden space-y-3">
        {table.getRowModel().rows.map((row) => (
          <div key={row.id} className="bg-card border border-border rounded-lg p-4 space-y-2">
            {columns.map((col) => (
              <div key={col.key} className="flex items-start justify-between gap-3">
                <div className="text-xs text-muted-foreground min-w-[110px]">{col.label}</div>
                <div className="text-sm font-medium flex-1 text-right break-words">
                  {col.render(row.original as any)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      "px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider",
                      (header.column.columnDef.meta as any)?.hideOnMobile && "hidden sm:table-cell"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "hover:bg-accent transition-colors",
                  row.getIsSelected() && "bg-accent",
                  getRowClass ? getRowClass(row.original as UserType) : ''
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <td 
                    key={cell.id} 
                    className={cn(
                      "px-6 py-4 whitespace-nowrap text-sm",
                      (cell.column.columnDef.meta as any)?.hideOnMobile && "hidden sm:table-cell"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Số bản ghi trên trang:
            </span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="px-3 py-1 border border-input rounded-lg text-sm focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
            >
              {[10, 20, 30, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                data.length
              )}{' '}
              của {data.length}
            </span>

            <div className="flex gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
