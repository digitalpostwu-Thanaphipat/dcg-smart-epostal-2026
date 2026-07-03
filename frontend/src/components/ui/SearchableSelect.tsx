import React, { useState, useEffect, useRef, useMemo, useId } from 'react';
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  id: string | number;
  label: string;
  subLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
  group?: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  id?: string;
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  loading?: boolean;
  error?: string | null;
  className?: string;
  disabled?: boolean;
  allowCustom?: boolean;
  onCustomChange?: (value: string) => void;
  groupOrder?: string[];
  groupIcons?: { [key: string]: React.ComponentType<{ className?: string }> };
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = "ค้นหา...",
  label,
  loading = false,
  error = null,
  className,
  disabled = false,
  allowCustom = false,
  onCustomChange,
  groupOrder,
  groupIcons
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const uniqueId = useId();
  const listboxId = `listbox-${uniqueId}`;

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options
  const filteredOptions = useMemo(() => {
    let filtered = options.filter(opt =>
      String(opt.label).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(opt.subLabel || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Grouping logic
    if (filtered.length > 0 && filtered[0].group) {
      const groups: { [key: string]: Option[] } = {};
      filtered.forEach(opt => {
        const groupName = opt.group || "อื่นๆ";
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(opt);
      });

      // Sort groups based on groupOrder
      const sortedGroupNames = Object.keys(groups).sort((a, b) => {
        if (!groupOrder) return a.localeCompare(b);
        const indexA = groupOrder.indexOf(a);
        const indexB = groupOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      const flatList: any[] = [];
      sortedGroupNames.forEach(groupName => {
        flatList.push({ 
          type: 'header', 
          label: groupName, 
          count: groups[groupName].length,
          icon: groupIcons?.[groupName]
        });
        groups[groupName].forEach(opt => flatList.push({ ...opt, type: 'option' }));
      });
      return flatList;
    }

    return filtered.map(opt => ({ ...opt, type: 'option' }));
  }, [options, searchTerm, groupOrder, groupIcons]);

  const activeOptionId = useMemo(() => 
    highlightedIndex >= 0 && filteredOptions[highlightedIndex]?.type === 'option' 
      ? `option-${filteredOptions[highlightedIndex].id}` 
      : undefined
  , [highlightedIndex, filteredOptions]);

  const selectedOption = options.find(opt => String(opt.id) === String(value));

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const selectableOptions = filteredOptions.map((opt, idx) => ({ ...opt, index: idx }))
      .filter(opt => opt.type === 'option');

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const nextIndex = selectableOptions.findIndex(opt => opt.index > prev);
          return nextIndex !== -1 ? selectableOptions[nextIndex].index : selectableOptions[0].index;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const reversed = [...selectableOptions].reverse();
          const nextIndex = reversed.findIndex(opt => opt.index < prev);
          return nextIndex !== -1 ? reversed[nextIndex].index : selectableOptions[selectableOptions.length - 1].index;
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex].type === 'option') {
          handleSelect(filteredOptions[highlightedIndex]);
        } else if (allowCustom && searchTerm.trim() !== "") {
          if (onCustomChange) onCustomChange(searchTerm);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Reset highlight when search term changes or dropdown opens
  useEffect(() => {
    if (isOpen) {
      const firstOption = filteredOptions.findIndex(opt => opt.type === 'option');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHighlightedIndex(firstOption);
    } else {
      setHighlightedIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, searchTerm]);

  const currentLabel = selectedOption ? selectedOption.label : (value ? String(value) : "");
  const CurrentIcon = selectedOption?.icon;

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">{label}</label>}

      <div
        role="combobox"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listboxId : undefined}
        aria-label={label || placeholder}
        aria-disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 rounded-2xl cursor-pointer transition-all focus:outline-none focus:ring-4 focus:ring-zinc-100 dark:focus:ring-zinc-800/50",
          isOpen ? "border-zinc-900 dark:border-white ring-4 ring-zinc-100 dark:ring-zinc-800" : "border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600",
          disabled && "opacity-50 cursor-not-allowed grayscale",
          error && "border-rose-500 ring-rose-100 dark:ring-rose-900/20"
        )}
      >
        <div className="flex-1 truncate flex items-center gap-3">
          {CurrentIcon && <CurrentIcon className="w-5 h-5 text-primary shrink-0" />}
          <div className="flex-1 truncate">
            {currentLabel ? (
              <span className="text-zinc-900 dark:text-zinc-100 font-bold">{currentLabel}</span>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 font-medium">{placeholder}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
          {value && !disabled && (
            <button
              type="button"
              className="w-4 h-4 text-zinc-300 hover:text-rose-500 transition-colors focus:outline-none" 
              aria-label="ล้างค่าที่เลือก"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            >
              <X className="w-full h-full" />
            </button>
          )}
          <ChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[999] w-full mt-2 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b-2 border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                ref={inputRef}
                autoFocus
                placeholder="พิมพ์เพื่อค้นหา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="ค้นหาตัวเลือก"
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-activedescendant={activeOptionId}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm font-bold focus:ring-0"
              />
            </div>
          </div>

          <div 
            id={listboxId}
            className="max-h-64 overflow-y-auto p-2 space-y-1" 
            role="listbox"
            aria-label="รายการตัวเลือก"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                if (opt.type === 'header') {
                  const HeaderIcon = opt.icon;
                  return (
                    <div key={`header-${idx}`} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center justify-between bg-zinc-50/50 dark:bg-white/5 rounded-lg mb-1">
                      <div className="flex items-center gap-2">
                        {HeaderIcon && <HeaderIcon className="w-3.5 h-3.5 text-primary/60" />}
                        {opt.label}
                      </div>
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">{opt.count}</span>
                    </div>
                  );
                }

                const isSelected = String(opt.id) === String(value);
                const OptIcon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    id={`option-${opt.id}`}
                    onClick={() => handleSelect(opt)}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                      isSelected ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : (highlightedIndex === idx ? "bg-zinc-100 dark:bg-zinc-800 ring-2 ring-inset ring-primary" : "hover:bg-zinc-100 dark:hover:bg-zinc-800")
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {OptIcon && <OptIcon className={cn("w-4 h-4 shrink-0", isSelected ? "text-white" : "text-zinc-400 group-hover:text-primary")} />}
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{opt.label}</span>
                        {opt.subLabel && (
                          <span className={cn("text-[10px] font-medium opacity-60", isSelected ? "text-white/80" : "text-zinc-500")}>
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                );
              })

            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-bold text-zinc-400">ไม่พบข้อมูลที่ค้นหา</p>
                {allowCustom && searchTerm.trim() !== "" && (
                   <button
                    onClick={() => {
                        if (onCustomChange) onCustomChange(searchTerm);
                        setIsOpen(false);
                    }}
                    aria-label={`ใช้คำค้นหา ${searchTerm}`}
                    className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors hover:bg-blue-600"
                   >
                     ใช้คำค้นหา: "{searchTerm}"
                   </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs font-bold text-rose-500">{error}</p>}
    </div>
  );
};
