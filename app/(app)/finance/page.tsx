'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatCurrency } from '@/lib/utils';

const monthOptions = [
  { label: 'Current Month', value: 'current' },
  { label: 'Last Month', value: 'last' },
  { label: 'Last 3 Months', value: '3m' },
  { label: 'Last 6 Months', value: '6m' },
  { label: 'This Year', value: 'year' },
  { label: 'Custom Range', value: 'custom' },
];

const allInvoices = [
  { id: 'INV-001', client: 'James & Sarah Mitchell', project: 'Hampton Residence', amount: 15000, outstanding: 0, status: 'Paid', issued: new Date(2024, 10, 1), due: new Date(2024, 10, 15) },
  { id: 'INV-002', client: 'Michael Chen', project: 'Urban Loft Project', amount: 8500, outstanding: 8500, status: 'Pending', issued: new Date(2024, 10, 15), due: new Date(2024, 10, 30) },
  { id: 'INV-003', client: 'TechCorp Inc.', project: 'Modern Office Space', amount: 22000, outstanding: 22000, status: 'Overdue', issued: new Date(2024, 9, 20), due: new Date(2024, 10, 5) },
  { id: 'INV-004', client: 'Alexandra Thompson', project: 'Coastal Villa Renovation', amount: 12750, outstanding: 0, status: 'Paid', issued: new Date(2024, 9, 30), due: new Date(2024, 10, 14) },
  { id: 'INV-005', client: 'Victoria Lee', project: 'Penthouse Suite', amount: 5000, outstanding: 5000, status: 'Upcoming', issued: new Date(2024, 10, 18), due: new Date(2024, 11, 5) },
  { id: 'INV-006', client: 'Emma Collins', project: 'Boutique Hotel Lobby', amount: 18000, outstanding: 18000, status: 'Pending', issued: new Date(2024, 8, 15), due: new Date(2024, 8, 30) },
  { id: 'INV-007', client: 'James & Sarah Mitchell', project: 'Hampton Residence', amount: 48000, outstanding: 0, status: 'Paid', issued: new Date(2024, 7, 1), due: new Date(2024, 7, 15) },
  { id: 'INV-008', client: 'Alexandra Thompson', project: 'Coastal Villa Renovation', amount: 72000, outstanding: 0, status: 'Paid', issued: new Date(2024, 8, 1), due: new Date(2024, 8, 15) },
];

const statusColors: Record<string, string> = {
  'Paid': 'bg-green-50 text-green-700',
  'Pending': 'bg-amber-50 text-amber-700',
  'Overdue': 'bg-red-50 text-red-700',
  'Upcoming': 'bg-blue-50 text-blue-700',
  'Draft': 'bg-muted text-muted-foreground',
};

const statusFilters = ['All', 'Pending', 'Paid', 'Overdue', 'Upcoming'];

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getDateRange(filter: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (filter) {
    case 'current':
      return { start: thisMonth, end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    case 'last':
      return { start: new Date(now.getFullYear(), now.getMonth() - 1, 1), end: new Date(now.getFullYear(), now.getMonth(), 0) };
    case '3m':
      return { start: new Date(now.getFullYear(), now.getMonth() - 3, 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    case '6m':
      return { start: new Date(now.getFullYear(), now.getMonth() - 6, 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    case 'year':
      return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
    case 'custom':
      return {
        start: customStart ? new Date(customStart) : new Date(now.getFullYear(), 0, 1),
        end: customEnd ? new Date(customEnd) : now,
      };
    default:
      return { start: thisMonth, end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
  }
}

export default function FinancePage() {
  const [monthFilter, setMonthFilter] = useState('current');
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const monthMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (monthMenuRef.current && !monthMenuRef.current.contains(e.target as Node)) {
        setShowMonthMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const dateRange = getDateRange(monthFilter, customStart, customEnd);

  const invoices = useMemo(() => {
    return allInvoices.filter((inv) => {
      // Status filter
      if (statusFilter !== 'All' && inv.status !== statusFilter) return false;

      // Date range filter (based on issued date)
      if (inv.issued < dateRange.start || inv.issued > dateRange.end) return false;

      return true;
    });
  }, [statusFilter, dateRange]);

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + i.outstanding, 0);
  const overdue = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.outstanding, 0);
  const upcoming = invoices.filter(i => i.status === 'Upcoming').reduce((s, i) => s + i.outstanding, 0);

  const selectedMonth = monthOptions.find(m => m.value === monthFilter);
  const isCustom = monthFilter === 'custom';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <button className="notion-button bg-foreground text-background hover:bg-foreground/90">
          <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
          Create Invoice
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-semibold">{formatCurrency(totalRevenue)}</span>
          </div>
          <p className="text-xs text-green-600 mt-2">+12% from last period</p>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-semibold">{formatCurrency(outstanding)}</span>
          </div>
          <div className="mt-2">
            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
              {invoices.filter(i => i.status === 'Pending').length} invoice{invoices.filter(i => i.status === 'Pending').length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Overdue</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-semibold">{formatCurrency(overdue)}</span>
          </div>
          <div className="mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              overdue > 0
                ? 'bg-red-50 text-red-700'
                : 'text-muted-foreground'
            }`}>
              {invoices.filter(i => i.status === 'Overdue').length} invoice{invoices.filter(i => i.status === 'Overdue').length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="kpi-card">
          <p className="text-sm text-muted-foreground">Upcoming</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-semibold">{formatCurrency(upcoming)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Due in next 7 days</p>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Status filter tabs */}
        <div className="flex items-center gap-1">
          {statusFilters.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                statusFilter === s
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Date filter */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={monthMenuRef}>
            <button
              onClick={() => setShowMonthMenu(!showMonthMenu)}
              className="notion-button border border-border gap-1.5 text-sm"
            >
              <span className="material-icons-outlined" style={{ fontSize: 15 }}>calendar_today</span>
              {selectedMonth?.label}
              <span className="material-icons-outlined" style={{ fontSize: 14 }}>expand_more</span>
            </button>
            {showMonthMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg z-20 py-1">
                {monthOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setMonthFilter(opt.value); setShowMonthMenu(false); }}
                    className={`flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors ${
                      monthFilter === opt.value ? 'text-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {opt.label}
                    {monthFilter === opt.value && (
                      <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom range inputs */}
          {isCustom && (
            <div className="flex items-center gap-2">
              <div className="w-36">
                <DatePicker
                  value={customStart}
                  onChange={setCustomStart}
                  placeholder="Start date"
                />
              </div>
              <span className="text-muted-foreground text-sm">to</span>
              <div className="w-36">
                <DatePicker
                  value={customEnd}
                  onChange={setCustomEnd}
                  placeholder="End date"
                  align="right"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="table-header text-left">Invoice</th>
              <th className="table-header text-left">Project</th>
              <th className="table-header text-left">Client</th>
              <th className="table-header text-left">Issued</th>
              <th className="table-header text-right">Total</th>
              <th className="table-header text-right">Outstanding</th>
              <th className="table-header text-left">Due</th>
              <th className="table-header text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-muted/20 cursor-pointer border-b border-border/50 last:border-b-0">
                <td className="table-cell font-medium">{invoice.id}</td>
                <td className="table-cell text-muted-foreground">{invoice.project}</td>
                <td className="table-cell text-muted-foreground">{invoice.client}</td>
                <td className="table-cell text-muted-foreground">{formatDate(invoice.issued)}</td>
                <td className="table-cell text-right">{formatCurrency(invoice.amount)}</td>
                <td className="table-cell text-right">{formatCurrency(invoice.outstanding)}</td>
                <td className="table-cell text-muted-foreground">{formatDate(invoice.due)}</td>
                <td className="table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[invoice.status] ?? 'bg-muted text-muted-foreground'}`}>
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="table-cell text-center text-muted-foreground py-10">
                  No invoices match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
