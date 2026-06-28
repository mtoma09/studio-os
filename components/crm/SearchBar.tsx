'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border border-border text-sm text-muted-foreground focus-within:border-foreground/30 transition-colors min-w-[220px]">
      <span className="material-icons-outlined flex-shrink-0" style={{ fontSize: 16 }}>search</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent outline-none w-full placeholder:text-muted-foreground text-foreground"
      />
      {value && (
        <button onClick={() => onChange('')}>
          <span className="material-icons-outlined" style={{ fontSize: 14 }}>close</span>
        </button>
      )}
    </div>
  );
}
