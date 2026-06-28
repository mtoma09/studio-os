'use client';

import { useState, useRef, useEffect } from 'react';
import { mockClients } from '@/lib/crm-data';

interface ClientSelectProps {
  value: string;
  onChange: (clientId: string) => void;
  onAddNew?: () => void;
}

export function ClientSelect({ value, onChange, onAddNew }: ClientSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = mockClients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.primaryContact.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    );
  });

  const selected = mockClients.find((c) => c.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="modal-input flex items-center justify-between gap-2 text-left"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected ? `${selected.primaryContact} (${selected.company})` : 'Select client'}
        </span>
        <span className="material-icons-outlined text-muted-foreground flex-shrink-0" style={{ fontSize: 16 }}>
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-muted rounded-lg">
              <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 14 }}>search</span>
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No clients found</p>
            ) : (
              filtered.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => { onChange(client.id); setOpen(false); setSearch(''); }}
                  className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors ${
                    value === client.id ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <div>
                    <p>{client.primaryContact}</p>
                    <p className="text-xs text-muted-foreground">{client.company}</p>
                  </div>
                  {value === client.id && (
                    <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>
                  )}
                </button>
              ))
            )}
          </div>

          {onAddNew && (
            <div className="border-t border-border p-1">
              <button
                type="button"
                onClick={() => { setOpen(false); onAddNew(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <span className="material-icons-outlined" style={{ fontSize: 15 }}>add</span>
                New Client
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
