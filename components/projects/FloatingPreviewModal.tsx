'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Printer } from 'lucide-react';
import { InvoicePreview, InvoicePreviewData } from '@/components/projects/InvoicePreview';

export interface FloatingPreviewModalProps {
  data: InvoicePreviewData;
  onClose: () => void;
  /** When true, the modal is offset to the left of a right-anchored side panel. */
  anchorToLeft?: boolean;
}

export function FloatingPreviewModal({ data, onClose, anchorToLeft = true }: FloatingPreviewModalProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const visibleRef = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    // Delay the modal's entrance so the side panel slides in first.
    const t = setTimeout(() => {
      const r = requestAnimationFrame(() => setVisible(true));
      visibleRef.current = r;
    }, 180);
    return () => {
      clearTimeout(t);
      if (visibleRef.current) cancelAnimationFrame(visibleRef.current);
    };
  }, [mounted]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  if (!mounted) return null;

  const modalWidth = 560;
  const gap = 24;

  return createPortal(
    <div
      className={`fixed top-0 bottom-0 z-50 transition-all duration-300 ease-out print:hidden ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        right: visible
          ? (anchorToLeft ? `calc(min(42vw, 640px) + ${gap}px)` : '24px')
          : '-600px',
        width: modalWidth,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
        style={{ width: modalWidth, height: 'min(82vh, 760px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border flex-shrink-0">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">Live Preview</p>
            <p className="text-[11px] text-muted-foreground truncate">{data.number || 'Invoice'} · {data.clientName || '—'}</p>
          </div>
          <button onClick={() => window.print()} className="btn-primary text-xs px-3 py-1.5">
            <Printer size={13} />
            Export
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto modal-scroll bg-muted/20 print:overflow-visible">
          <InvoicePreview data={data} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
