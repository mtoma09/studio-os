'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SidePanelProps {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  headerExtra?: React.ReactNode;
  /** When true, triggers the exit animation. Parent should call onClose after the animation duration. */
  closing?: boolean;
}

export function SidePanel({ title, subtitle, onClose, children, footer, width = 'min(45vw, 820px)', headerExtra, closing = false }: SidePanelProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const visibleRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setVisible(true));
      visibleRef.current = r2;
    });
    return () => {
      cancelAnimationFrame(r1);
      if (visibleRef.current) cancelAnimationFrame(visibleRef.current);
    };
  }, [mounted]);

  // When closing prop flips to true, start exit animation
  useEffect(() => {
    if (closing) setVisible(false);
  }, [closing]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!mounted) return null;

  return createPortal(
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
        <div className="flex items-start justify-between gap-3 px-6 pt-4 pb-3 border-b border-border flex-shrink-0">
          <div className="min-w-0 pt-0.5">
            {title && <h2 className="font-semibold text-base leading-none">{title}</h2>}
            {subtitle && <p className={`text-xs text-muted-foreground ${title ? 'mt-1' : 'mt-0'}`}>{subtitle}</p>}
          </div>
          {headerExtra}
          <button onClick={handleClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors -mt-0.5 flex-shrink-0">
            <X size={18} className="text-muted-foreground" />
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
    </>,
    document.body
  );
}
