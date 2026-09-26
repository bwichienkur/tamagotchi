"use client";

import type { ReactNode } from "react";
import { RemoteImage } from "@/components/ui/remote-image";
import type { WikiChartConfig, WikiChartRow } from "@/lib/wiki-sections";
import { cn } from "@/lib/utils";

interface WikiChartViewProps {
  chart: WikiChartConfig;
  className?: string;
}

export function WikiChartView({ chart, className }: WikiChartViewProps) {
  const columnCount = chart.columns.length;

  return (
    <div className={cn("wiki-chart overflow-x-auto", className)}>
      <table className="w-full min-w-[640px] border-collapse border border-stone-300 text-sm text-stone-800">
        <thead>
          <tr className="bg-stone-100">
            {chart.columns.map((column) => (
              <th
                key={column}
                className="border border-stone-300 px-2 py-2 text-left font-semibold text-stone-900"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chart.groups.map((group) => (
            <GroupBody key={group.id} groupId={group.id} title={group.title} rows={group.rows} columnCount={columnCount} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GroupBody({
  groupId,
  title,
  rows,
  columnCount,
}: {
  groupId: string;
  title: string;
  rows: WikiChartRow[];
  columnCount: number;
}) {
  const rowspanRemaining = Array(columnCount).fill(0);

  return (
    <>
      <tr className="bg-stone-50">
        <td
          colSpan={columnCount}
          id={groupId}
          className="scroll-mt-24 border border-stone-300 px-3 py-2 font-semibold text-stone-900"
        >
          {title}
        </td>
      </tr>
      {rows.map((row) => {
        const cells: ReactNode[] = [];

        for (let columnIndex = 0; columnIndex < columnCount; columnIndex++) {
          if (rowspanRemaining[columnIndex] > 0) {
            rowspanRemaining[columnIndex] -= 1;
            continue;
          }

          const cell = row.cells[columnIndex] ?? {};
          const rowSpan = cell.rowSpan && cell.rowSpan > 1 ? cell.rowSpan : undefined;
          if (rowSpan && rowSpan > 1) {
            rowspanRemaining[columnIndex] = rowSpan - 1;
          }

          cells.push(
            <td
              key={`${row.id}-${columnIndex}`}
              rowSpan={rowSpan}
              className="border border-stone-300 px-2 py-2 align-top"
            >
              <ChartCellContent cell={cell} />
            </td>
          );
        }

        return <tr key={row.id}>{cells}</tr>;
      })}
    </>
  );
}

function ChartCellContent({ cell }: { cell: WikiChartRow["cells"][number] }) {
  const hasText = Boolean(cell.text?.trim());
  const hasImage = Boolean(cell.imageUrl);

  if (!hasText && !hasImage) {
    return <span className="text-stone-400">—</span>;
  }

  return (
    <>
      {hasImage ? (
        <div className="relative mx-auto h-16 w-16">
          <RemoteImage
            src={cell.imageUrl!}
            alt=""
            fill
            className="object-contain"
            sizes="64px"
          />
        </div>
      ) : null}
      {hasText ? (
        <div
          className={cn(
            "wiki-chart-cell prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0",
            hasImage && "mt-2"
          )}
          dangerouslySetInnerHTML={{ __html: formatCellText(cell.text!) }}
        />
      ) : null}
    </>
  );
}

function formatCellText(text: string): string {
  if (text.includes("<")) return text;
  const lines = text.split("\n").filter(Boolean);
  if (lines.length <= 1) return `<p>${escapeHtml(lines[0] ?? text)}</p>`;
  return `<ul>${lines.map((line) => `<li>${escapeHtml(line.replace(/^[•\-]\s*/, ""))}</li>`).join("")}</ul>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
