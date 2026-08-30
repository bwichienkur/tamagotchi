"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface DeviceModelComboboxOption extends ComboboxOption {
  familyId?: string;
}

interface CreatableComboboxProps {
  options: ComboboxOption[];
  value?: string;
  pendingLabel?: string;
  onValueChange: (value: string, isNew?: boolean, label?: string) => void;
  onCreateOption?: (label: string) => Promise<ComboboxOption | null>;
  placeholder?: string;
  createLabel?: (value: string) => string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function CreatableCombobox({
  options,
  value,
  pendingLabel,
  onValueChange,
  onCreateOption,
  placeholder = "Search or type to create...",
  createLabel = (v) => `Add "${v}"`,
  emptyMessage = "Type a name and press Enter to add it.",
  className,
  disabled = false,
}: CreatableComboboxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [creating, setCreating] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  const selected = options.find((option) => option.value === value);
  const displayValue = selected?.label ?? pendingLabel ?? "";

  useEffect(() => {
    if (!open) {
      setInputValue(displayValue);
    }
  }, [displayValue, open]);

  const filtered = options.filter((option) =>
    option.label.toLowerCase().includes(inputValue.trim().toLowerCase())
  );

  const trimmedInput = inputValue.trim();
  const exactMatch = options.find(
    (option) => option.label.toLowerCase() === trimmedInput.toLowerCase()
  );
  const showCreate =
    trimmedInput.length > 0 &&
    !exactMatch &&
    (!selected || selected.label.toLowerCase() !== trimmedInput.toLowerCase());

  const listItems = [
    ...filtered.map((option) => ({ type: "option" as const, option })),
    ...(showCreate ? [{ type: "create" as const, label: trimmedInput }] : []),
  ];

  useEffect(() => {
    setHighlightIndex(0);
  }, [inputValue, open]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const selectExisting = (option: ComboboxOption) => {
    onValueChange(option.value, false, option.label);
    setInputValue(option.label);
    setOpen(false);
  };

  const selectNew = async (label: string) => {
    const normalized = label.trim();
    if (!normalized) return;

    const existing = options.find(
      (option) => option.label.toLowerCase() === normalized.toLowerCase()
    );
    if (existing) {
      selectExisting(existing);
      return;
    }

    if (onCreateOption) {
      setCreating(true);
      try {
        const created = await onCreateOption(normalized);
        if (created) {
          onValueChange(created.value, false, created.label);
          setInputValue(created.label);
          setOpen(false);
          return;
        }
      } finally {
        setCreating(false);
      }
    }

    onValueChange(`__new__:${normalized}`, true, normalized);
    setInputValue(normalized);
    setOpen(false);
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex((current) => Math.min(current + 1, Math.max(listItems.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlightIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = listItems[highlightIndex];
      if (item?.type === "option") {
        selectExisting(item.option);
        return;
      }
      if (item?.type === "create") {
        await selectNew(item.label);
        return;
      }
      if (trimmedInput) {
        await selectNew(trimmedInput);
      }
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
      setInputValue(displayValue);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Input
        ref={inputRef}
        value={inputValue}
        disabled={disabled || creating}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setInputValue(event.target.value);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="h-11"
      />
      {open && (
        <div
          id={listId}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-lg"
        >
          {listItems.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-stone-500">{emptyMessage}</p>
          ) : (
            listItems.map((item, index) => {
              if (item.type === "option") {
                const isSelected = item.option.value === value;
                return (
                  <button
                    key={item.option.value}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectExisting(item.option)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100",
                      (highlightIndex === index || isSelected) && "bg-tama-cyan/10"
                    )}
                  >
                    <Check
                      className={cn("h-4 w-4 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                    />
                    {item.option.label}
                  </button>
                );
              }

              return (
                <button
                  key={`create-${item.label}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void selectNew(item.label)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-tama-cyan hover:bg-tama-cyan/10",
                    highlightIndex === index && "bg-tama-cyan/10"
                  )}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  {creating ? "Saving..." : createLabel(item.label)}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
