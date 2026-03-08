import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Search, Filter, Plus, ChevronLeft, ChevronRight, ArrowUpDown, Monitor, Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { Machine } from '../types';
import { cn } from '../lib/utils';
import { getFileIcon } from '../lib/fileUtils';

interface DataTableProps {
  data: Machine[];
  onCreate?: () => void;
}

export default function DataTable({ data, onCreate }: DataTableProps) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo<ColumnDef<Machine>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring accent-primary"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-ring accent-primary"
          />
        ),
        size: 40,
        meta: {
          hideOnMobile: true,
        },
      },
      {
        id: 'image',
        header: 'Ảnh',
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            {row.original.image ? (
              <img
                src={row.original.image}
                alt={row.original.name}
                className="h-12 w-20 object-cover rounded-lg border border-border"
              />
            ) : (
              <div className="h-12 w-20 bg-muted rounded-lg flex items-center justify-center">
                <Monitor className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
        ),
        size: 120,
        meta: {
          hideOnMobile: true,
        },
      },
      {
        accessorKey: 'model',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Mã model
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-secondary text-secondary-foreground">
            {row.original.model}
          </span>
        ),
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tên
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
      },
      {
        accessorKey: 'description',
        header: 'Mô tả',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.description}</span>
        ),
        meta: {
          hideOnMobile: true,
        },
      },
      {
        accessorKey: 'category',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Danh mục
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-md bg-muted text-muted-foreground">
            {row.original.category}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tạo lúc
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {format(new Date(row.original.createdAt), 'dd/MM/yyyy')}
          </span>
        ),
      },
      {
        accessorKey: 'manualUrl',
        header: 'Tài liệu',
        cell: ({ row }) => (
          <div className="space-y-1">
            {row.original.manualUrl && row.original.manualUrl.length > 0 ? (
              <div className="flex items-center gap-1">
                <div className="flex-shrink-0">
                  {getFileIcon('document')}
                </div>
                <span className="text-xs text-muted-foreground">
                  {row.original.manualUrl.length} file{row.original.manualUrl.length > 1 ? 's' : ''}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Không có</span>
            )}
          </div>
        ),
        size: 100,
        meta: {
          hideOnMobile: true,
        },
      },
      {
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/product/${row.original.id}`)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600/10 text-primary rounded hover:bg-blue-600/20 transition-colors"
            >
              <Eye className="h-3 w-3" />
              Xem
            </button>
          </div>
        ),
        size: 100,
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data,
    columns,
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
              placeholder="Tìm kiếm..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Lọc</span>
            </button>
            <button onClick={onCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-primary-foreground rounded-lg hover:bg-blue-600/90 transition-colors cursor-pointer">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo mới</span>
            </button>
            {/* <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Xuất File</span>
            </button> */}
          </div>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block sm:hidden space-y-3">
        {table.getRowModel().rows.map((row) => (
          <div key={row.id} className="bg-card border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {row.original.image ? (
                    <img
                      src={row.original.image}
                      alt={row.original.name}
                      className="h-12 w-12 object-cover rounded-lg border border-border"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center">
                      <Monitor className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{row.original.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">{row.original.model}</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/product/${row.original.id}`)}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-600/10 text-primary rounded hover:bg-blue-600/20 transition-colors"
              >
                <Eye className="h-3 w-3" />
                Xem
              </button>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.original.category}</span>
              <span className="text-muted-foreground">
                {format(new Date(row.original.createdAt), 'dd/MM/yyyy')}
              </span>
            </div>
            
            {row.original.description && (
              <p className="text-sm text-muted-foreground overflow-hidden" style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>{row.original.description}</p>
            )}
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
                  row.getIsSelected() && "bg-accent"
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