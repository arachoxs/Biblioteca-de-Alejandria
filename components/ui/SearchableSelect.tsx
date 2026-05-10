"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  id: string;
  label: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  noOptionsText?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | boolean;
}

export default function SearchableSelect({
  id,
  label,
  value,
  options,
  onChange,
  onBlur,
  onSearchChange,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Escribe para buscar...",
  noOptionsText = "No se encontraron resultados.",
  required = false,
  disabled = false,
  error = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const hasError = Boolean(error);
  const errorMessage = typeof error === "string" ? error : undefined;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return options;

    return options.filter((option) => {
      const searchableText =
        `${option.label} ${option.subtitle ?? ""}`.toLocaleLowerCase();
      return searchableText.includes(normalized);
    });
  }, [options, query]);

  const inputValue = isOpen ? query : (selectedOption?.label ?? "");

  const handleInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    setQuery("");
  };

  const handleInputBlur = () => {
    onBlur?.();
    setTimeout(() => {
      setIsOpen(false);
      setQuery("");
    }, 120);
  };

  const handleInputChange = (nextValue: string) => {
    setQuery(nextValue);
    onSearchChange?.(nextValue);
  };

  const handleSelectOption = (option: SearchableSelectOption) => {
    onChange(option.value);
    onBlur?.();
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div className="flex flex-col  gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-brand-primary tracking-wide">
        {label}
        {required && !disabled && (
          <span className="text-brand-primary ml-1">*</span>
        )}
      </label>

      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-secondary/70" />
          <input
            id={id}
            type="text"
            value={inputValue}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            required={required}
            disabled={disabled}
            autoComplete="off"
            aria-autocomplete="list"
            aria-invalid={hasError}
            aria-describedby={errorMessage ? `${id}-error` : undefined}
            className={`w-full pl-10 pr-10 py-2.5 rounded-lg border transition-all duration-300 shadow-sm
              bg-brand-bg text-brand-text
              placeholder:text-brand-accent
              focus:outline-none focus:ring-2
              ${
                disabled
                  ? "opacity-90 bg-brand-secondary/5 border-dashed border-brand-secondary/40 text-brand-secondary cursor-not-allowed"
                  : hasError
                    ? "border-red-500 focus:ring-red-400/60 focus:border-red-500"
                    : "border-brand-secondary focus:ring-brand-accent/60 focus:border-brand-primary"
              }`}
          />
          <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondary/70" />
        </div>

        {isOpen && !disabled && (
          <div
            role="listbox"
            aria-label={searchPlaceholder}
            className="absolute z-40 mt-1 w-full rounded-lg border border-brand-accent/30 bg-white shadow-lg max-h-56 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-brand-secondary/70">
                {noOptionsText}
              </p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full text-left px-3 py-2.5 hover:bg-brand-bg transition-colors cursor-pointer ${
                    value === option.value ? "bg-brand-primary/5" : "bg-white"
                  }`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelectOption(option)}>
                  <p className="text-sm font-medium text-brand-text">
                    {option.label}
                  </p>
                  {option.subtitle && (
                    <p className="text-xs text-brand-secondary mt-0.5">
                      {option.subtitle}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <p id={`${id}-error`} className="text-xs text-red-500 mt-0.5">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
