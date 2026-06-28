'use client';

import { useState, useRef, useEffect } from 'react';

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  icon?: string;
}

export function FilterDropdown({ label, value, options, onChange, icon = 'filter_list' }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasValue = value !== options[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`notion-button border gap-1.5 text-sm transition-colors ${
          hasValue ? 'border-foreground/30 bg-muted text-foreground' : 'border-border text-muted-foreground'
        }`}
      >
        <span className="material-icons-outlined" style={{ fontSize: 15 }}>{icon}</span>
        <span className="max-w-[120px] truncate">{hasValue ? value : label}</span>
        <span className="material-icons-outlined" style={{ fontSize: 14 }}>expand_more</span>
      </button>

      {open && (
        <div className="absolute left-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg z-30 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors ${
                value === opt ? 'text-foreground font-medium' : 'text-muted-foreground'
              }`}
            >
              {opt}
              {value === opt && (
                <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
