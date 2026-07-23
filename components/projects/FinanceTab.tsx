'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Ellipsis as MoreHorizontal, Eye, FileDown, Trash2, Receipt, TrendingUp, FileText, CircleAlert as AlertCircle, Printer, Pencil, ChevronDown, Check } from 'lucide-react';
import { Project, Invoice, InvoiceLineItem, formatBudget } from '@/lib/projects-data';
import { SidePanel } from '@/components/ui/SidePanel';
import { DatePicker } from '@/components/ui/DatePicker';

interface FinanceTabProps {
  project: Project;
  onUpdateInvoices?: (invoices: Invoice[]) => void;
}

type InvoiceFilter = 'Paid' | 'Unpaid' | 'Overdue' | 'Issued';
const invoiceFilters: InvoiceFilter[] = ['Paid', 'Unpaid', 'Overdue', 'Issued'];

const statusBadgeColors: Record<string, string> = {
  Paid: 'bg-green-50 text-green-700 border border-green-200',
  Unpaid: 'bg-amber-50 text-amber-700 border border-amber-200',
  Overdue: 'bg-red-50 text-red-700 border border-red-200',
  Issued: 'bg-blue-50 text-blue-700 border border-blue-200',
};

interface LineItem { id: string; description: string; hours: string; rate: string; }

function emptyLine(): LineItem { return { id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, description: '', hours: '', rate: '' }; }
function toISODate(d: Date): string { return d.toISOString().slice(0, 10); }
function lineAmount(l: LineItem): number { return (parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0); }

// ── Portal dropdown (escapes overflow-hidden containers) ─────────────────────
interface PortalMenuProps {
  anchorRect: DOMRect | null;
  onClose: () => void;
  children: React.ReactNode;
}
function PortalMenu({ anchorRect, onClose, children }: PortalMenuProps) {
  useEffect(() => {
    const h = () => onClose();
    document.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => { document.removeEventListener('scroll', h, true); window.removeEventListener('resize', h); };
  }, [onClose]);

  if (!anchorRect) return null;
  const top = anchorRect.bottom + 4;
  const left = Math.min(anchorRect.right - 176, window.innerWidth - 200);
  return createPortal(
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        className="fixed z-[61] w-44 bg-popover border border-border rounded-xl shadow-lg py-1 overflow-hidden"
        style={{ top, left }}
      >
        {children}
      </div>
    </>,
    document.body
  );
}

// ── Add Invoice Side Panel ───────────────────────────────────────────────────
interface AddInvoicePanelProps {
  project: Project;
  onClose: () => void;
  onSave: (inv: Invoice) => void;
}

function AddInvoicePanel({ project, onClose, onSave }: AddInvoicePanelProps) {
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [companyName, setCompanyName] = useState('ergonome studio');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companySuburb, setCompanySuburb] = useState('');
  const [abn, setAbn] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [bsb, setBsb] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [bicSwift, setBicSwift] = useState('');
  const [referenceDesc, setReferenceDesc] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueOnReceipt, setDueOnReceipt] = useState(false);
  const [status, setStatus] = useState<Invoice['status']>('Issued');
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [notes, setNotes] = useState('');
  const [statusOpen, setStatusOpen] = useState(false);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + lineAmount(l), 0), [lines]);

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (id: string) => setLines(prev => prev.filter(l => l.id !== id));
  const updateLine = (id: string, field: keyof LineItem, value: string) =>
    setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));

  const canSave = invoiceDate && invoiceNumber && clientName;

  const handleSave = () => {
    if (!canSave) return;
    const inv: Invoice = {
      id: `inv-${Date.now()}`,
      number: invoiceNumber,
      clientName,
      clientAddress,
      amount: subtotal,
      issuedDate: new Date(invoiceDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      dueDate: dueOnReceipt ? 'Upon Receipt' : (dueDate ? new Date(dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''),
      status,
      companyName,
      companyAddress,
      companySuburb,
      abn,
      accountHolder,
      bsb,
      accountNo,
      bankName,
      bicSwift,
      referenceDesc,
      lineItems: lines.map(l => ({ id: l.id, description: l.description, hours: l.hours, rate: l.rate })),
      notes,
    };
    onSave(inv);
  };

  return (
    <SidePanel
      subtitle={project.name}
      onClose={onClose}
      width="min(52vw, 780px)"
      footer={
        <>
          <div />
          <div className="flex gap-2">
            <button onClick={onClose} className="notion-button border border-border">Cancel</button>
            <button onClick={handleSave} disabled={!canSave} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Create Invoice
            </button>
          </div>
        </>
      }
    >
      <div className="px-6 py-5 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Invoice Date *</label>
            <DatePicker value={invoiceDate ? new Date(invoiceDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} onChange={(v) => { const d = new Date(v); if (!isNaN(d.getTime())) setInvoiceDate(toISODate(d)); }} placeholder="Select date" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Invoice Number *</label>
            <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="YY001.001" className="modal-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Bill To *</label>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" className="modal-input mb-2" />
              <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Client Address&#10;Suburb State Postcode&#10;Country" rows={3} className="modal-input resize-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground mb-1.5">Company Information</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" className="modal-input" />
            <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Address" className="modal-input" />
            <input value={companySuburb} onChange={e => setCompanySuburb(e.target.value)} placeholder="Suburb State Postcode, Australia" className="modal-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground mb-1.5">Payment Information</label>
            <input value={accountHolder} onChange={e => setAccountHolder(e.target.value)} placeholder="Account Holder" className="modal-input" />
            <div className="grid grid-cols-2 gap-2">
              <input value={bsb} onChange={e => setBsb(e.target.value)} placeholder="BSB" className="modal-input" />
              <input value={accountNo} onChange={e => setAccountNo(e.target.value)} placeholder="Account No" className="modal-input" />
            </div>
            <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank Name" className="modal-input" />
            <input value={bicSwift} onChange={e => setBicSwift(e.target.value)} placeholder="BIC/SWIFT Code" className="modal-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">ABN</label>
            <input value={abn} onChange={e => setAbn(e.target.value)} placeholder="12 345 678 910" className="modal-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Reference Description</label>
            <input value={referenceDesc} onChange={e => setReferenceDesc(e.target.value)} placeholder="Reference Description" className="modal-input" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Due Date</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="on-receipt" checked={dueOnReceipt} onChange={e => setDueOnReceipt(e.target.checked)} className="rounded" />
              <label htmlFor="on-receipt" className="text-sm text-muted-foreground">Upon Receipt</label>
            </div>
            {!dueOnReceipt && (
              <DatePicker value={dueDate ? new Date(dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} onChange={(v) => { const d = new Date(v); if (!isNaN(d.getTime())) setDueDate(toISODate(d)); }} placeholder="Select date" />
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-2">Line Items</label>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium px-3 py-2">Description</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-3 py-2 w-20">Hours</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-3 py-2 w-28">Hourly Rate AUD</th>
                  <th className="text-right text-xs text-muted-foreground font-medium px-3 py-2 w-28">Amount AUD</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {lines.map(line => (
                  <tr key={line.id} className="border-b border-border/40 last:border-b-0">
                    <td className="px-3 py-2">
                      <input value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)} placeholder="Description" className="w-full text-sm outline-none bg-transparent" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={line.hours} onChange={e => updateLine(line.id, 'hours', e.target.value)} placeholder="0.00" className="w-full text-sm text-right outline-none bg-transparent" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={line.rate} onChange={e => updateLine(line.id, 'rate', e.target.value)} placeholder="$" className="w-full text-sm text-right outline-none bg-transparent" />
                    </td>
                    <td className="px-3 py-2 text-right text-sm">${lineAmount(line).toFixed(2)}</td>
                    <td className="px-2 py-2">
                      {lines.length > 1 && (
                        <button onClick={() => removeLine(line.id)} className="text-muted-foreground hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-3 py-2 border-t border-border/40">
              <button onClick={addLine} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Plus size={13} />
                Add line item
              </button>
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <div className="w-56 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-border pt-1.5">
                <span>TOTAL AUD</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
            <div className="relative">
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className="notion-button border border-border w-full justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeColors[status as Invoice['status']] || 'bg-muted text-muted-foreground'}`}>{status}</span>
                </span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setStatusOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    {(['Issued', 'Paid', 'Unpaid', 'Overdue'] as Invoice['status'][]).map(s => (
                      <button
                        key={s}
                        onClick={() => { setStatus(s); setStatusOpen(false); }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors whitespace-nowrap"
                      >
                        <span className={status === s ? 'text-foreground font-medium' : 'text-muted-foreground'}>{s}</span>
                        {status === s && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." rows={2} className="modal-input resize-none" />
          </div>
        </div>
      </div>
    </SidePanel>
  );
}

// ── Invoice Preview Modal (matches reference format) ─────────────────────────
interface InvoicePreviewModalProps {
  invoice: Invoice;
  onClose: () => void;
}
function InvoicePreviewModal({ invoice, onClose }: InvoicePreviewModalProps) {
  const handleExportPDF = useCallback(() => {
    window.print();
  }, []);

  const lineItems = invoice.lineItems && invoice.lineItems.length > 0
    ? invoice.lineItems
    : [{ id: 'default', description: invoice.referenceDesc || 'Design services', hours: '', rate: '' }];

  const subtotal = lineItems.reduce((s, l) => s + (parseFloat(l.hours) || 0) * (parseFloat(l.rate) || 0), 0);
  const total = subtotal || invoice.amount;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8">
      {/* Frosted glass overlay */}
      <div
        className="absolute inset-0 transition-opacity"
        style={{ background: 'rgba(220,218,212,0.55)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
        onClick={onClose}
      />

      {/* Modal container */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col bg-card rounded-2xl shadow-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0 print:hidden">
          <div>
            <h2 className="font-semibold text-base">{invoice.number}</h2>
            <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportPDF} className="btn-primary">
              <Printer size={15} />
              Export PDF
            </button>
            <button onClick={onClose} className="notion-button border border-border">Close</button>
          </div>
        </div>

        {/* Invoice document (scrollable, print target) */}
        <div className="flex-1 overflow-y-auto modal-scroll print:overflow-visible print:max-h-none">
          <div className="invoice-document mx-auto" style={{ maxWidth: '800px' }}>
            {/* Cream background page */}
            <div className="bg-[#FAF8F2] px-8 md:px-12 py-10 md:py-12 print:bg-[#FAF8F2] print:px-12 print:py-12">
              {/* Header: logo left, "Invoice" heading right */}
              <div className="flex items-start justify-between mb-10">
                <div className="flex items-center gap-2.5">
                  <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-lg object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-foreground leading-tight">{invoice.companyName || 'ergonome studio'}</p>
                    {(invoice.abn) && <p className="text-[10px] text-muted-foreground">ABN: {invoice.abn}</p>}
                  </div>
                </div>
                <h1 className="text-3xl font-semibold text-foreground tracking-tight">Invoice</h1>
              </div>

              {/* 2-column info grid */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Left column: Bill To + Invoice details */}
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Bill To</p>
                    <p className="text-sm font-medium text-foreground leading-snug">{invoice.clientName}</p>
                    {invoice.clientAddress && (
                      <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed mt-0.5">{invoice.clientAddress}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Invoice Number</p>
                      <p className="text-sm text-foreground">{invoice.number}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Invoice Date</p>
                      <p className="text-sm text-foreground">{invoice.issuedDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Due Date</p>
                      <p className="text-sm text-foreground">{invoice.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Reference</p>
                      <p className="text-sm text-foreground">{invoice.referenceDesc || '—'}</p>
                    </div>
                  </div>
                </div>

                {/* Right column: Company info + Payment details */}
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">From</p>
                    <p className="text-sm font-medium text-foreground leading-snug">{invoice.companyName || 'ergonome studio'}</p>
                    {invoice.companyAddress && <p className="text-xs text-muted-foreground leading-relaxed">{invoice.companyAddress}</p>}
                    {invoice.companySuburb && <p className="text-xs text-muted-foreground leading-relaxed">{invoice.companySuburb}</p>}
                    {invoice.abn && <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">ABN: {invoice.abn}</p>}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Payment Details</p>
                    {invoice.accountHolder && <p className="text-xs text-muted-foreground leading-relaxed">Account Holder: {invoice.accountHolder}</p>}
                    {invoice.bankName && <p className="text-xs text-muted-foreground leading-relaxed">Bank: {invoice.bankName}</p>}
                    <div className="flex gap-4">
                      {invoice.bsb && <p className="text-xs text-muted-foreground leading-relaxed">BSB: {invoice.bsb}</p>}
                      {invoice.accountNo && <p className="text-xs text-muted-foreground leading-relaxed">Account: {invoice.accountNo}</p>}
                    </div>
                    {invoice.bicSwift && <p className="text-xs text-muted-foreground leading-relaxed">BIC/SWIFT: {invoice.bicSwift}</p>}
                  </div>
                </div>
              </div>

              {/* Line items table */}
              <div className="mb-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-foreground/20">
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5">Description</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 w-20">Hours</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 w-24">Rate AUD</th>
                      <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-2.5 w-24">Amount AUD</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((line, idx) => {
                      const amt = (parseFloat(line.hours) || 0) * (parseFloat(line.rate) || 0);
                      return (
                        <tr key={line.id} className={idx < lineItems.length - 1 ? 'border-b border-foreground/10' : ''}>
                          <td className="py-3 text-sm text-foreground">{line.description || '—'}</td>
                          <td className="py-3 text-sm text-right text-muted-foreground">{line.hours || '—'}</td>
                          <td className="py-3 text-sm text-right text-muted-foreground">{line.rate ? `$${line.rate}` : '—'}</td>
                          <td className="py-3 text-sm text-right font-medium text-foreground">${amt.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals — right aligned */}
              <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (GST)</span>
                    <span className="text-foreground">$0.00</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold border-t-2 border-foreground/20 pt-2">
                    <span>TOTAL AUD</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-foreground/15 pt-5">
                {invoice.notes && (
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{invoice.notes}</p>
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  Thank you for your business. Payment is due {invoice.dueDate || 'upon receipt'}.<br />
                  Please include invoice number {invoice.number} in payment reference.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Edit Invoice Side Panel ──────────────────────────────────────────────────
interface EditInvoicePanelProps {
  invoice: Invoice;
  onClose: () => void;
  onSave: (inv: Invoice) => void;
}

function EditInvoicePanel({ invoice, onClose, onSave }: EditInvoicePanelProps) {
  const [number, setNumber] = useState(invoice.number);
  const [clientName, setClientName] = useState(invoice.clientName);
  const [clientAddress, setClientAddress] = useState(invoice.clientAddress || '');
  const [amount, setAmount] = useState(String(invoice.amount));
  const [issuedDate, setIssuedDate] = useState(invoice.issuedDate || '');
  const [dueDate, setDueDate] = useState(invoice.dueDate || '');
  const [status, setStatus] = useState<Invoice['status']>(invoice.status);
  const [companyName, setCompanyName] = useState(invoice.companyName || '');
  const [companyAddress, setCompanyAddress] = useState(invoice.companyAddress || '');
  const [abn, setAbn] = useState(invoice.abn || '');
  const [referenceDesc, setReferenceDesc] = useState(invoice.referenceDesc || '');
  const [notes, setNotes] = useState(invoice.notes || '');

  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleSave = () => {
    onSave({
      ...invoice,
      number,
      clientName,
      clientAddress,
      amount: parseFloat(amount) || 0,
      issuedDate,
      dueDate,
      status,
      companyName,
      companyAddress,
      abn,
      referenceDesc,
      notes,
    });
  };

  return (
    <SidePanel
      subtitle={invoice.number}
      onClose={onClose}
      width="min(45vw, 640px)"
      footer={
        <>
          <div />
          <div className="flex gap-2">
            <button onClick={onClose} className="notion-button border border-border">Cancel</button>
            <button onClick={handleSave} className="btn-primary">Save Changes</button>
          </div>
        </>
      }
    >
      <div className="px-6 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Invoice Number *</label>
            <input value={number} onChange={e => setNumber(e.target.value)} className="modal-input" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Status</label>
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => setStatusOpen(!statusOpen)}
                className="notion-button border border-border w-full justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeColors[invoice.status] || 'bg-muted text-muted-foreground'}`}>{status}</span>
                </span>
                <ChevronDown size={14} className="text-muted-foreground" />
              </button>
              {statusOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setStatusOpen(false)} />
                  <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                    {(['Issued', 'Paid', 'Unpaid', 'Overdue'] as Invoice['status'][]).map(s => (
                      <button
                        key={s}
                        onClick={() => { setStatus(s); setStatusOpen(false); }}
                        className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors whitespace-nowrap"
                      >
                        <span className={status === s ? 'text-foreground font-medium' : 'text-muted-foreground'}>{s}</span>
                        {status === s && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Bill To *</label>
          <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" className="modal-input mb-2" />
          <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Client Address" rows={2} className="modal-input resize-none" />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">From</label>
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company name" className="modal-input mb-2" />
          <input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Company address" className="modal-input" />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">ABN</label>
          <input value={abn} onChange={e => setAbn(e.target.value)} placeholder="12 345 678 910" className="modal-input" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Amount (AUD)</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="modal-input" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Reference</label>
            <input value={referenceDesc} onChange={e => setReferenceDesc(e.target.value)} className="modal-input" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Issued Date</label>
            <DatePicker value={issuedDate} onChange={setIssuedDate} placeholder="Select date" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Due Date</label>
            <DatePicker value={dueDate ? new Date(dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} onChange={(v) => { const d = new Date(v); if (!isNaN(d.getTime())) setDueDate(toISODate(d)); }} placeholder="Select date" />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional notes..." rows={3} className="modal-input resize-none" />
        </div>
      </div>
    </SidePanel>
  );
}

// ── Row 3-dot menu ───────────────────────────────────────────────────────────
interface InvoiceMenuProps {
  invoice: Invoice;
  onDetails: () => void;
  onPreview: () => void;
  onExport: () => void;
  onDelete: () => void;
}
function InvoiceRowMenu({ invoice, onDetails, onPreview, onExport, onDelete }: InvoiceMenuProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(!open);
  };

  const close = () => setOpen(false);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <PortalMenu anchorRect={rect} onClose={close}>
          <button onClick={() => { close(); onPreview(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground">
            <Eye size={14} className="text-muted-foreground" /> Preview
          </button>
          <button onClick={() => { close(); onExport(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground">
            <FileDown size={14} className="text-muted-foreground" /> Export PDF
          </button>
          <button onClick={() => { close(); onDetails(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground">
            <Pencil size={14} className="text-muted-foreground" /> Edit Details
          </button>
          <button onClick={() => { close(); onDelete(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-red-50 transition-colors text-red-600">
            <Trash2 size={14} /> Delete
          </button>
        </PortalMenu>
      )}
    </>
  );
}

// ── Main FinanceTab ──────────────────────────────────────────────────────────
export function FinanceTab({ project, onUpdateInvoices }: FinanceTabProps) {
  const [activeFilter, setActiveFilter] = useState<InvoiceFilter>('Issued');
  const [search, setSearch] = useState('');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>(project.invoices || []);

  const totalEarnings = useMemo(() => invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0), [invoices]);
  const paidCount = useMemo(() => invoices.filter(i => i.status === 'Paid').length, [invoices]);
  const totalIssued = useMemo(() => invoices.reduce((s, i) => s + i.amount, 0), [invoices]);
  const issuedCount = invoices.length;
  const overdueTotal = useMemo(() => invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0), [invoices]);
  const overdueCount = useMemo(() => invoices.filter(i => i.status === 'Overdue').length, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(i => {
      const matchFilter = i.status === activeFilter;
      const matchSearch = !search || i.number.toLowerCase().includes(q) || i.clientName.toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }, [invoices, activeFilter, search]);

  const handleAddInvoice = (inv: Invoice) => {
    const updated = [inv, ...invoices];
    setInvoices(updated);
    onUpdateInvoices?.(updated);
    setShowAddPanel(false);
    setActiveFilter(inv.status as InvoiceFilter);
  };

  const handleDeleteInvoice = (id: string) => {
    const updated = invoices.filter(i => i.id !== id);
    setInvoices(updated);
    onUpdateInvoices?.(updated);
  };

  const handleSaveEdit = (inv: Invoice) => {
    const updated = invoices.map(i => i.id === inv.id ? inv : i);
    setInvoices(updated);
    onUpdateInvoices?.(updated);
    setEditInvoice(null);
  };

  const handleExportPDF = (inv: Invoice) => {
    setPreviewInvoice(inv);
    setTimeout(() => window.print(), 400);
  };

  return (
    <div className="space-y-5">
      {showAddPanel && (
        <AddInvoicePanel project={project} onClose={() => setShowAddPanel(false)} onSave={handleAddInvoice} />
      )}
      {editInvoice && (
        <EditInvoicePanel invoice={editInvoice} onClose={() => setEditInvoice(null)} onSave={handleSaveEdit} />
      )}
      {previewInvoice && (
        <InvoicePreviewModal invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />
      )}

      {/* Top 3 KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <TrendingUp size={20} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Project Earnings</p>
            <p className="text-xl font-semibold mt-0.5 truncate">{formatBudget(totalEarnings)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{paidCount} paid invoice{paidCount !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="kpi-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <FileText size={20} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Invoices Issued</p>
            <p className="text-xl font-semibold mt-0.5 truncate">{formatBudget(totalIssued)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{issuedCount} invoice{issuedCount !== 1 ? 's' : ''} issued</p>
          </div>
        </div>

        <div className="kpi-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
            <AlertCircle size={20} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Overdue Invoices</p>
            <p className="text-xl font-semibold mt-0.5 truncate">{formatBudget(overdueTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{overdueCount} overdue invoice{overdueCount !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Invoice list section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex border border-border rounded-lg overflow-hidden">
            {invoiceFilters.map((f, i) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`h-8 px-3 text-sm font-medium transition-colors ${i > 0 ? 'border-l border-border' : ''} ${activeFilter === f ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 h-8 text-sm border border-border rounded-lg bg-background w-48 placeholder:text-muted-foreground outline-none focus:border-foreground/30 transition-colors"
            />
          </div>

          <button onClick={() => setShowAddPanel(true)} className="btn-primary">
            <Plus size={15} />
            Add New Invoice
          </button>
        </div>

        <div className="card-base overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt size={32} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {invoices.length === 0 ? 'No invoices for this project yet' : `No ${activeFilter.toLowerCase()} invoices`}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="table-header text-left">Invoice #</th>
                  <th className="table-header text-left">Client</th>
                  <th className="table-header text-right">Amount</th>
                  <th className="table-header text-left">Issued</th>
                  <th className="table-header text-left">Due</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header w-24" />
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="group/inv hover:bg-muted/20 transition-colors border-b border-border/40 last:border-b-0">
                    <td className="table-cell"><p className="font-medium text-sm">{inv.number}</p></td>
                    <td className="table-cell text-muted-foreground text-sm">{inv.clientName}</td>
                    <td className="table-cell text-right font-medium text-sm">{formatBudget(inv.amount)}</td>
                    <td className="table-cell text-muted-foreground text-sm">{inv.issuedDate}</td>
                    <td className="table-cell text-muted-foreground text-sm">{inv.dueDate}</td>
                    <td className="table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadgeColors[inv.status]}`}>{inv.status}</span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover/inv:opacity-100 transition-opacity">
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="h-7 px-2.5 text-xs font-medium rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        >
                          Preview
                        </button>
                        <InvoiceRowMenu
                          invoice={inv}
                          onDetails={() => setEditInvoice(inv)}
                          onPreview={() => setPreviewInvoice(inv)}
                          onExport={() => handleExportPDF(inv)}
                          onDelete={() => handleDeleteInvoice(inv.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
