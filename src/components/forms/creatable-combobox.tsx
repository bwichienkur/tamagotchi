"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface CreatableComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string, isNew?: boolean, label?: string) => void;
  placeholder?: string;
  createLabel?: (value: string) => string;
  emptyMessage?: string;
  className?: string;
}

export function CreatableCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Search or create...",
  createLabel = (v) => `Create "${v}"`,
  emptyMessage = "No results found.",
  className,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = options.find((o) => o.value === value);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const showCreate =
    search.trim().length > 0 &&
    !options.some(
      (o) => o.label.toLowerCase() === search.trim().toLowerCase()
    );

  const handleSelect = useCallback(
    (optionValue: string, isNew = false, label?: string) => {
      onValueChange(optionValue, isNew, label);
      setOpen(false);
      setSearch("");
    },
    [onValueChange]
  );

  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="truncate">
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2">
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="max-h-60 overflow-auto p-1">
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-stone-100",
                value === option.value && "bg-tama-cyan/10"
              )}
            >
              <Check
                className={cn(
                  "h-4 w-4",
                  value === option.value ? "opacity-100" : "opacity-0"
                )}
              />
              {option.label}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onClick={() =>
                handleSelect(`__new__:${search.trim()}`, true, search.trim())
              }
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-tama-cyan hover:bg-tama-cyan/10"
            >
              <Plus className="h-4 w-4" />
              {createLabel(search.trim())}
            </button>
          )}
          {filtered.length === 0 && !showCreate && (
            <p className="px-2 py-4 text-center text-sm text-stone-500">
              {emptyMessage}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
