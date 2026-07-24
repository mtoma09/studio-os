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
  /** When true, modal is centred on screen (used for saved invoice preview). */
  centred?: boolean;
  /** Heading text. Defaults to "Live Preview". */
  heading?: string;
}

export function FloatingPreviewModal({ data, onClose, anchorToLeft = true, centred = false, heading = 'Live Preview' }: FloatingPreviewModalProps) {
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

  // ── Centred mode (for saved invoice preview) ──────────────────────────────
  if (centred) {
    return createPortal(
      <div
        className={`fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8 transition-opacity duration-300 print:hidden ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div
          className="absolute inset-0 transition-opacity print:hidden"
          style={{ background: 'rgba(220,218,212,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
          onClick={handleClose}
        />
        <div
          className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden print:max-w-none print:max-h-none print:rounded-none print:shadow-none print:static print:w-full"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0 print:hidden">
            <div>
              <h2 className="font-semibold text-base">{heading}</h2>
              <p className="text-xs text-muted-foreground">{data.number || 'Invoice'} · {data.clientName || '—'}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="btn-primary">
                <Printer size={15} />
                Export PDF
              </button>
              <button onClick={handleClose} className="notion-button border border-border">Close</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto modal-scroll print:overflow-visible print:max-h-none">
            <InvoicePreview data={data} />
          </div>
        </div>
      </div>,
      document.body,
    );
  }

  // ── Anchored mode (live preview beside side panel) ─────────────────────────
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
            <p className="text-sm font-semibold truncate">{heading}</p>
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
