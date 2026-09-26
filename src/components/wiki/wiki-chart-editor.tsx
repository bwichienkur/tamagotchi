"use client";

import { Fragment, useRef, useState } from "react";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RemoteImage } from "@/components/ui/remote-image";
import { uploadImage } from "@/lib/upload-image";
import {
  createChartRow,
  type WikiChartCell,
  type WikiChartConfig,
  type WikiChartGroup,
} from "@/lib/wiki-sections";

interface WikiChartEditorProps {
  chart: WikiChartConfig;
  onChange: (chart: WikiChartConfig) => void;
}

export function WikiChartEditor({ chart, onChange }: WikiChartEditorProps) {
  const columnCount = chart.columns.length;

  const updateColumns = (columns: string[]) => {
    onChange({
      columns,
      groups: chart.groups.map((group) => ({
        ...group,
        rows: group.rows.map((row) => ({
          ...row,
          cells: columns.map((_, index) => row.cells[index] ?? {}),
        })),
      })),
    });
  };

  const updateGroup = (groupId: string, updates: Partial<WikiChartGroup>) => {
    onChange({
      ...chart,
      groups: chart.groups.map((group) =>
        group.id === groupId ? { ...group, ...updates } : group
      ),
    });
  };

  const updateCell = (
    groupId: string,
    rowId: string,
    columnIndex: number,
    updates: Partial<WikiChartCell>
  ) => {
    onChange({
      ...chart,
      groups: chart.groups.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          rows: group.rows.map((row) => {
            if (row.id !== rowId) return row;
            const cells = [...row.cells];
            while (cells.length < columnCount) cells.push({});
            cells[columnIndex] = { ...cells[columnIndex], ...updates };
            return { ...row, cells };
          }),
        };
      }),
    });
  };

  const addGroup = () => {
    onChange({
      ...chart,
      groups: [
        ...chart.groups,
        {
          id: `group-${Date.now()}`,
          title: "New group",
          rows: [createChartRow(columnCount)],
        },
      ],
    });
  };

  const addRow = (groupId: string) => {
    onChange({
      ...chart,
      groups: chart.groups.map((group) =>
        group.id === groupId
          ? { ...group, rows: [...group.rows, createChartRow(columnCount)] }
          : group
      ),
    });
  };

  const deleteRow = (groupId: string, rowId: string) => {
    onChange({
      ...chart,
      groups: chart.groups.map((group) => {
        if (group.id !== groupId) return group;
        const rows = group.rows.filter((row) => row.id !== rowId);
        return { ...group, rows: rows.length ? rows : [createChartRow(columnCount)] };
      }),
    });
  };

  const deleteGroup = (groupId: string) => {
    if (chart.groups.length <= 1) {
      toast.error("Keep at least one chart group");
      return;
    }
    onChange({
      ...chart,
      groups: chart.groups.filter((group) => group.id !== groupId),
    });
  };

  return (
    <div className="space-y-4 rounded-xl border border-tama-cyan/30 bg-tama-cyan/5 p-4">
      <div>
        <h3 className="text-sm font-semibold text-stone-800">Character chart</h3>
        <p className="mt-1 text-xs text-stone-500">
          Add multiple groups (e.g. Smart Group, Kind Group). Each group gets its own sub-header row
          in the table, like on the Tamagotchi Wiki.
        </p>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-stone-500">Column headers</Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {chart.columns.map((column, index) => (
            <Input
              key={`col-${index}`}
              value={column}
              onChange={(event) => {
                const columns = [...chart.columns];
                columns[index] = event.target.value;
                updateColumns(columns);
              }}
              placeholder={`Column ${index + 1}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateColumns([...chart.columns, "New column"])}
          >
            <Plus className="h-4 w-4" />
            Add column
          </Button>
          {chart.columns.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => updateColumns(chart.columns.slice(0, -1))}
            >
              Remove last column
            </Button>
          )}
        </div>
      </div>

      {chart.groups.map((group) => (
        <div key={group.id} className="rounded-xl border border-stone-200 bg-white p-3">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Group
            </span>
            <Input
              value={group.title}
              onChange={(event) => updateGroup(group.id, { title: event.target.value })}
              className="max-w-md flex-1 font-semibold"
              placeholder="Smart Group (Blue Egg)"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => deleteGroup(group.id)}>
              <Trash2 className="h-4 w-4 text-red-400" />
            </Button>
          </div>

          <div className="space-y-3">
            {group.rows.map((row, rowIndex) => (
              <div key={row.id} className="rounded-lg border border-dashed border-stone-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-stone-500">Row {rowIndex + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRow(group.id, row.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {chart.columns.map((columnLabel, columnIndex) => (
                    <ChartCellEditor
                      key={`${row.id}-${columnIndex}`}
                      label={columnLabel}
                      cell={row.cells[columnIndex] ?? {}}
                      onChange={(updates) =>
                        updateCell(group.id, row.id, columnIndex, updates)
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => addRow(group.id)}
          >
            <Plus className="h-4 w-4" />
            Add row
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={addGroup}>
        <Plus className="h-4 w-4" />
        Add group (subsection)
      </Button>
    </div>
  );
}

function ChartCellEditor({
  label,
  cell,
  onChange,
}: {
  label: string;
  cell: WikiChartCell;
  onChange: (updates: Partial<WikiChartCell>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onChange({ imageUrl: url });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-lg bg-stone-50 p-2">
      <Label className="text-xs text-stone-600">{label}</Label>
      {cell.imageUrl ? (
        <div className="relative mt-1 h-14 w-14">
          <RemoteImage src={cell.imageUrl} alt="" fill className="object-contain" sizes="56px" />
        </div>
      ) : null}
      <Input
        value={cell.imageUrl ?? ""}
        onChange={(event) => onChange({ imageUrl: event.target.value || undefined })}
        placeholder="Image URL"
        className="mt-1 h-8 text-xs"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleUpload(file);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="mt-1 h-7 px-2 text-xs"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImagePlus className="h-3.5 w-3.5" />
        {uploading ? "Uploading…" : "Upload"}
      </Button>
      <Textarea
        value={cell.text ?? ""}
        onChange={(event) => onChange({ text: event.target.value })}
        placeholder="Text or HTML (use • for bullets)"
        rows={2}
        className="mt-1 text-xs"
      />
      <Input
        type="number"
        min={1}
        max={10}
        value={cell.rowSpan ?? ""}
        onChange={(event) => {
          const value = event.target.value;
          onChange({
            rowSpan: value ? Math.max(1, Number.parseInt(value, 10) || 1) : undefined,
          });
        }}
        placeholder="Row span"
        className="mt-1 h-8 text-xs"
      />
    </div>
  );
}
