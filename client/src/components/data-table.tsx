import { useState, useMemo } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import ActionMenu from "@/components/action-menu";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  searchable?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selected: any[]) => void;
  actions?: (row: any) => any[];
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
}

export default function DataTable({
  data,
  columns,
  searchable = true,
  selectable = false,
  onSelectionChange,
  actions,
  filters = []
}: DataTableProps) {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (searchTerm && searchable) {
      filtered = filtered.filter(row =>
        columns.some(col =>
          String(row[col.key]).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        filtered = filtered.filter(row => String(row[key]) === value);
      }
    });

    // Apply sorting
    if (sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortOrder === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortBy, sortOrder, activeFilters, columns, searchable]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredAndSortedData);
      onSelectionChange?.(filteredAndSortedData);
    } else {
      setSelectedRows([]);
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (row: any, checked: boolean) => {
    let newSelection;
    if (checked) {
      newSelection = [...selectedRows, row];
    } else {
      newSelection = selectedRows.filter(r => r !== row);
    }
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  const getSortIcon = (key: string) => {
    if (sortBy !== key) return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-500" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-blue-400" />
      : <ArrowDown className="w-3 h-3 ml-1 text-blue-400" />;
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          )}
          
          {filters.map(filter => (
            <Select
              key={filter.key}
              value={activeFilters[filter.key] || "all"}
              onValueChange={(value) => setActiveFilters(prev => ({ ...prev, [filter.key]: value }))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder={filter.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {selectedRows.length > 0 && (
          <Badge variant="secondary">
            {selectedRows.length} selected
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-900">
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.length === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map(column => (
                <TableHead key={column.key} className="text-gray-300">
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="h-auto p-0 font-medium hover:text-white flex items-center"
                    >
                      {column.label}
                      {getSortIcon(column.key)}
                    </Button>
                  ) : (
                    column.label
                  )}
                </TableHead>
              ))}
              {actions && <TableHead className="w-12">{t('actions')}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.map((row, index) => (
              <TableRow key={index} className="border-gray-800 hover:bg-gray-900/50">
                {selectable && (
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.includes(row)}
                      onCheckedChange={(checked) => handleSelectRow(row, checked as boolean)}
                    />
                  </TableCell>
                )}
                {columns.map(column => (
                  <TableCell key={column.key} className="text-gray-300">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    <ActionMenu items={actions(row)} />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedData.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No data found
        </div>
      )}
    </div>
  );
}