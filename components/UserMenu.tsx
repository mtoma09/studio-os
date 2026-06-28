'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

const USER_NAME = 'Ellie Sanders';
const USER_ROLE = 'Administrator';

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const initials = getInitials(USER_NAME);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', key);
    };
  }, []);

  const handleLogout = () => {
    setShowLogoutDialog(false);
    window.location.href = '/';
  };

  return (
    <>
      {showLogoutDialog && <LogoutDialog onConfirm={handleLogout} onCancel={() => setShowLogoutDialog(false)} />}

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 border border-border flex items-center justify-center transition-colors flex-shrink-0"
          title={USER_NAME}
        >
          <span className="text-xs font-semibold text-foreground select-none">{initials}</span>
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-foreground">{initials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{USER_NAME}</p>
                  <p className="text-xs text-muted-foreground truncate">{USER_ROLE}</p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>settings</span>
                Settings
              </Link>
              <button
                onClick={() => { setOpen(false); setShowLogoutDialog(true); }}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full text-left"
              >
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>logout</span>
                Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function LogoutDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/20" />
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-4">
          <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 20 }}>logout</span>
        </div>
        <h3 className="font-semibold mb-1">Sign out of StudioOS?</h3>
        <p className="text-sm text-muted-foreground mb-5">You will be redirected to the login screen.</p>
        <div className="flex items-center gap-2 justify-end">
          <button onClick={onCancel} className="notion-button border border-border">Cancel</button>
          <button onClick={onConfirm} className="notion-button bg-foreground text-background hover:bg-foreground/90">Log Out</button>
        </div>
      </div>
    </div>
  );
}
