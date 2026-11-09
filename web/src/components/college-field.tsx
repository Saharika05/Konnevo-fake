"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Plus } from "lucide-react";
import { profileService } from "@/lib/services/profile";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

/**
 * College can be typed or picked. The arrow button opens the list of colleges; typing narrows it.
 * Suggestions come from GET /api/colleges/suggest (an empty q returns the first colleges),
 * plus "+ Add [typed text] as a new college" for colleges that are not listed.
 */
export function CollegeField({
  id,
  value,
  onChange,
  onBlur,
  invalid,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const [debounced, setDebounced] = React.useState(value.trim());
  // True after the arrow button is pressed: show the list even before anything is typed.
  const [browse, setBrowse] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value.trim()), 250);
    return () => clearTimeout(timer);
  }, [value]);

  const suggestions = useQuery({
    queryKey: ["colleges", browse && debounced.length < 2 ? "" : debounced],
    queryFn: () => profileService.suggestColleges(browse && debounced.length < 2 ? "" : debounced),
    enabled: debounced.length >= 2 || browse,
    staleTime: 60_000,
  });

  const names = suggestions.data?.colleges ?? [];
  const typed = value.trim();
  const exact = names.some((name) => name.toLowerCase() === typed.toLowerCase());
  const options = [...names, ...(typed.length >= 2 && !exact ? [`__add__${typed}`] : [])];
  const showList = open && (debounced.length >= 2 || browse) && options.length > 0;

  function choose(option: string) {
    onChange(option.startsWith("__add__") ? option.slice(7) : option);
    setOpen(false);
    setBrowse(false);
    setActive(-1);
  }

  function toggleList() {
    if (showList) {
      setOpen(false);
      setBrowse(false);
    } else {
      setBrowse(true);
      setOpen(true);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => (index <= 0 ? options.length - 1 : index - 1));
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        className="pr-11"
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        placeholder="Start typing your college"
        onChange={(event) => {
          onChange(event.target.value);
          setBrowse(false);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Wait a moment so a click on a suggestion still lands.
          setTimeout(() => setOpen(false), 150);
          onBlur?.();
        }}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        aria-label={showList ? "Hide college list" : "Show college list"}
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        // Keep focus in the input so the list does not close before the click lands.
        onMouseDown={(event) => event.preventDefault()}
        onClick={toggleList}
        className="absolute inset-y-0 right-0 grid w-10 cursor-pointer place-items-center rounded-r-lg text-muted hover:text-foreground"
      >
        <ChevronDown className={cn("h-4 w-4 transition-transform", showList && "rotate-180")} aria-hidden="true" />
      </button>
      {showList && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-surface p-1 shadow-xl"
        >
          {options.map((option, index) => {
            const isAdd = option.startsWith("__add__");
            return (
              <li
                key={option}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(option);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm",
                  index === active ? "bg-subtle" : "hover:bg-subtle",
                  isAdd && "font-semibold text-primary-text",
                )}
              >
                {isAdd ? (
                  <>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Add “{option.slice(7)}” as a new college
                  </>
                ) : (
                  option
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
