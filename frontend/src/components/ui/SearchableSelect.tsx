import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  id: string | number;
  label: string;
  subLabel?: string;
  group?: string;
  [key: string]: any;
}

interface SearchableSelectProps {
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
  groupOrder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        flatList.push({ type: 'header', label: groupName, count: groups[groupName].length });
        groups[groupName].forEach(opt => flatList.push({ ...opt, type: 'option' }));
      });
      return flatList;
    }

    return filtered.map(opt => ({ ...opt, type: 'option' }));
  }, [options, searchTerm, groupOrder]);

  const selectedOption = options.find(opt => opt.id === value);

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setIsOpen(false);
    setSearchTerm("");
  };

  const currentLabel = selectedOption ? selectedOption.label : (value ? String(value) : "");

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">{label}</label>}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-800 border-2 rounded-2xl cursor-pointer transition-all",
          isOpen ? "border-zinc-900 dark:border-white ring-4 ring-zinc-100 dark:ring-zinc-800" : "border-zinc-100 dark:border-zinc-700 hover:border-zinc-200 dark:hover:border-zinc-600",
          disabled && "opacity-50 cursor-not-allowed grayscale",
          error && "border-rose-500 ring-rose-100 dark:ring-rose-900/20"
        )}
      >
        <div className="flex-1 truncate">
          {currentLabel ? (
            <span className="text-zinc-900 dark:text-zinc-100 font-bold">{currentLabel}</span>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500 font-medium">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
          {value && !disabled && (
            <X 
              className="w-4 h-4 text-zinc-300 hover:text-rose-500 transition-colors" 
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
            />
          )}
          <ChevronDown className={cn("w-5 h-5 text-zinc-400 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b-2 border-zinc-100 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                ref={inputRef}
                autoFocus
                placeholder="พิมพ์เพื่อค้นหา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-sm font-bold focus:ring-0"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                if (opt.type === 'header') {
                  return (
                    <div key={`header-${idx}`} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center justify-between">
                      {opt.label}
                      <span className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">{opt.count}</span>
                    </div>
                  );
                }

                const isSelected = opt.id === value;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all",
                      isSelected ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-bold">{opt.label}</span>
                      {opt.subLabel && (
                        <span className={cn("text-[10px] font-medium opacity-60", isSelected ? "text-white/80" : "text-zinc-500")}>
                          {opt.subLabel}
                        </span>
                      )}
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
