'use client';

import { useState } from 'react';
import { Schedule, ScheduleProduct } from '@/lib/schedules-data';

interface ExportScheduleModalProps {
  schedule: Schedule;
  selectedProducts?: string[];
  onClose: () => void;
}

type ExportFormat = 'PDF' | 'Excel' | 'CSV';
type ExportScope = 'All Products' | 'Selected Products';
type ExportLayout = 'Full Schedule' | 'Summary Only' | 'Spec Sheets';

export function ExportScheduleModal({
  schedule,
  selectedProducts = [],
  onClose,
}: ExportScheduleModalProps) {
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [scope, setScope] = useState<ExportScope>('All Products');
  const [layout, setLayout] = useState<ExportLayout>('Full Schedule');
  const [includePricing, setIncludePricing] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    // Placeholder for actual export logic
    await new Promise(resolve => setTimeout(resolve, 1500));
    setExporting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold">Export Schedule</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{schedule.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg">
            <span className="material-icons-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Format */}
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Format</label>
            <div className="flex gap-2">
              {(['PDF', 'Excel', 'CSV'] as ExportFormat[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    format === f
                      ? 'border-foreground bg-muted'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <span className="material-icons-outlined" style={{ fontSize: 16 }}>
                    {f === 'PDF' ? 'picture_as_pdf' : f === 'Excel' ? 'table_chart' : 'csv'}
                  </span>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Scope */}
          {selectedProducts.length > 0 && (
            <div>
              <label className="text-xs text-muted-foreground block mb-2">Export</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setScope('All Products')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    scope === 'All Products'
                      ? 'border-foreground bg-muted'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  All Products ({schedule.sections.flatMap(s => s.products).length})
                </button>
                <button
                  onClick={() => setScope('Selected Products')}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                    scope === 'Selected Products'
                      ? 'border-foreground bg-muted'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  Selected ({selectedProducts.length})
                </button>
              </div>
            </div>
          )}

          {/* Layout */}
          <div>
            <label className="text-xs text-muted-foreground block mb-2">Layout</label>
            <div className="space-y-2">
              {(['Full Schedule', 'Summary Only', 'Spec Sheets'] as ExportLayout[]).map(l => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className={`w-full px-3 py-2 text-sm text-left rounded-lg border transition-colors ${
                    layout === l
                      ? 'border-foreground bg-muted'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <span className="font-medium">{l}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {l === 'Full Schedule' && 'Complete product details with specifications'}
                    {l === 'Summary Only' && 'Condensed overview without detailed specs'}
                    {l === 'Spec Sheets' && 'Individual spec sheet per product'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground block">Include</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includePricing}
                onChange={(e) => setIncludePricing(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-foreground"
              />
              <span className="text-sm">Pricing information</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-foreground"
              />
              <span className="text-sm">Internal notes</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/30">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? (
              <>
                <span className="material-icons-outlined animate-spin" style={{ fontSize: 16 }}>autorenew</span>
                Exporting...
              </>
            ) : (
              <>
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>download</span>
                Export {format}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
