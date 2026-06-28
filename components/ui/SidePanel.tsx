'use client';

import { useEffect, useState } from 'react';

interface SidePanelProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export function SidePanel({ title, subtitle, onClose, children, footer, width = 'min(45vw, 820px)' }: SidePanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  return (
    <>
      {/* Frosted glass overlay — visible page, no text blur */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-280 ${visible ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(220,218,212,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        onClick={handleClose}
      />
      {/* Panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-280 ease-out"
        style={{ width, minWidth: 480, transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div>
            <h2 className="font-semibold text-base">{title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={handleClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <span className="material-icons-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Body — scrollable with thin scrollbar */}
        <div className="flex-1 min-h-0 modal-scroll">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-card flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
