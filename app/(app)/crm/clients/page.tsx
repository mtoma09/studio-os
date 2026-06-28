'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { mockClients, CLIENT_STATUSES, PROJECT_TYPES, Client } from '@/lib/crm-data';
import { formatBudget } from '@/lib/utils';
import { ClientStatusBadge } from '@/components/crm/StatusBadge';
import { EmptyState } from '@/components/crm/EmptyState';
import { PinButton } from '@/components/crm/PinButton';
import { SidePanel } from '@/components/ui/SidePanel';

const SORT_OPTIONS = [
  { label: 'Name', value: 'name' },
  { label: 'Status', value: 'status' },
  { label: 'Last Contact', value: 'contact' },
];

export default function ClientsPage() {
  const [view, setView] = useState<'card' | 'table'>('card');
  const [showModal, setShowModal] = useState(false);
  const [clients, setClients] = useState<Client[]>(mockClients);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // New client form state
  const [newClient, setNewClient] = useState({ name: '', company: '', email: '', phone: '' });

  const togglePin = (id: string) =>
    setClients(prev => prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return clients
      .filter(c => {
        if (q && ![c.company, c.primaryContact, c.email, c.phone].some(f => f.toLowerCase().includes(q))) return false;
        if (statusFilter !== 'All' && c.status !== statusFilter) return false;
        if (typeFilter !== 'All' && c.projectType !== typeFilter) return false;
        return true;
      })
      .sort((a, b) => {
        const pin = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        if (pin !== 0) return pin;
        let va = '', vb = '';
        if (sortBy === 'name') { va = a.primaryContact; vb = b.primaryContact; }
        else if (sortBy === 'status') { va = a.status; vb = b.status; }
        else if (sortBy === 'contact') { va = a.lastContact; vb = b.lastContact; }
        const cmp = va.localeCompare(vb);
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [clients, search, typeFilter, statusFilter, sortBy, sortOrder]);

  const hasFilters = typeFilter !== 'All' || statusFilter !== 'All';

  const handleCreateClient = () => {
    if (!newClient.name) return;
    const created: Client = {
      id: `c-${Date.now()}`,
      primaryContact: newClient.name,
      company: newClient.company,
      email: newClient.email,
      phone: newClient.phone,
      address: '',
      projectType: 'Residential',
      status: 'Active',
      assignedDesigner: '',
      lastContact: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      pinned: false,
      projects: [],
      contacts: [],
      notes: [],
      timeline: [],
      website: '',
      clientSince: new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
    };
    setClients(prev => [created, ...prev]);
    setNewClient({ name: '', company: '', email: '', phone: '' });
    setShowModal(false);
  };

  return (
    <>
      {showModal && (
        <SidePanel title="New Client" onClose={() => setShowModal(false)} footer={
          <><div /><div className="flex gap-2">
            <button onClick={() => setShowModal(false)} className="notion-button border border-border">Cancel</button>
            <button onClick={handleCreateClient} className="btn-primary">Create Client</button>
          </div></>
        }>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Full Name *</label>
              <input value={newClient.name} onChange={e => setNewClient(p => ({ ...p, name: e.target.value }))} placeholder="Sophie Williams" className="modal-input" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Company</label>
              <input value={newClient.company} onChange={e => setNewClient(p => ({ ...p, company: e.target.value }))} placeholder="Williams Family" className="modal-input" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
              <input type="email" value={newClient.email} onChange={e => setNewClient(p => ({ ...p, email: e.target.value }))} placeholder="sophie@email.com" className="modal-input" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Phone</label>
              <input value={newClient.phone} onChange={e => setNewClient(p => ({ ...p, phone: e.target.value }))} placeholder="+61 400 000 000" className="modal-input" />
            </div>
          </div>
        </SidePanel>
      )}

      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your client relationships.</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1" />

          <div className="relative">
            <span className="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: 16 }}>search</span>
            <input type="text" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background w-48 placeholder:text-muted-foreground outline-none focus:border-foreground/30 transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><span className="material-icons-outlined" style={{ fontSize: 14 }}>close</span></button>}
          </div>

          {/* Filter */}
          <div className="relative">
            <button onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }} title="Filter"
              className={`relative flex items-center justify-center w-9 h-9 border rounded-lg transition-colors ${hasFilters ? 'border-foreground/30 bg-muted text-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
              <span className="material-icons-outlined" style={{ fontSize: 18 }}>filter_list</span>
              {hasFilters && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-foreground" />}
            </button>
            {showFilterMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)} />
                <div className="absolute right-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg z-30 py-2 overflow-hidden">
                  <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Project Type</p>
                  {['All', ...PROJECT_TYPES].map(opt => (
                    <button key={opt} onClick={() => setTypeFilter(opt)}
                      className={`filter-item ${typeFilter === opt ? 'filter-item-active' : 'filter-item-inactive'}`}>
                      {opt}{typeFilter === opt && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}
                    </button>
                  ))}
                  <div className="border-t border-border/40 my-1" />
                  <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                  {['All', ...CLIENT_STATUSES].map(opt => (
                    <button key={opt} onClick={() => setStatusFilter(opt)}
                      className={`filter-item ${statusFilter === opt ? 'filter-item-active' : 'filter-item-inactive'}`}>
                      {opt}{statusFilter === opt && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}
                    </button>
                  ))}
                  {hasFilters && <div className="border-t border-border/40 px-3 pt-2 pb-1"><button onClick={() => { setTypeFilter('All'); setStatusFilter('All'); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button></div>}
                </div>
              </>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }} title="Sort"
              className="flex items-center justify-center w-9 h-9 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <span className="material-icons-outlined" style={{ fontSize: 18 }}>list_arrow</span>
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg z-30 py-2 overflow-hidden">
                  <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Sort By</p>
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                      className={`filter-item ${sortBy === opt.value ? 'filter-item-active' : 'filter-item-inactive'}`}>
                      {opt.label}{sortBy === opt.value && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}
                    </button>
                  ))}
                  <div className="border-t border-border/40 my-1" />
                  <button onClick={() => setSortOrder('asc')} className={`filter-item ${sortOrder === 'asc' ? 'filter-item-active' : 'filter-item-inactive'}`}>Ascending{sortOrder === 'asc' && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}</button>
                  <button onClick={() => setSortOrder('desc')} className={`filter-item ${sortOrder === 'desc' ? 'filter-item-active' : 'filter-item-inactive'}`}>Descending{sortOrder === 'desc' && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}</button>
                </div>
              </>
            )}
          </div>

          {/* View toggle */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button onClick={() => setView('card')} className={`px-2.5 py-1.5 flex items-center transition-colors ${view === 'card' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`} title="Cards">
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>grid_view</span>
            </button>
            <button onClick={() => setView('table')} className={`px-2.5 py-1.5 flex items-center border-l border-border transition-colors ${view === 'table' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`} title="Table">
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>table_rows</span>
            </button>
          </div>

          <button onClick={() => setShowModal(true)} className="btn-primary">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
            New Client
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="badge" title="No clients found"
            description={search || hasFilters ? 'Try adjusting your search or filters.' : 'Add your first client.'}
            action={{ label: '+ New Client', onClick: () => setShowModal(true) }} />
        ) : view === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(client => {
              const activeProjects = client.projects.filter(p => p.status === 'Active').length;
              const currentPhase = client.projects.find(p => p.status === 'Active')?.phase ?? '—';
              return (
                <div key={client.id} className="card-base card-hover p-4 cursor-pointer">
                  <Link href={`/crm/clients/${client.id}`} className="block">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0 flex-1"><p className="font-medium text-sm truncate">{client.primaryContact}</p><p className="text-xs text-muted-foreground truncate">{client.company}</p></div>
                      <div className="flex items-center gap-1.5 flex-shrink-0"><ClientStatusBadge status={client.status} /><PinButton pinned={client.pinned} onToggle={() => togglePin(client.id)} /></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Active Projects</span><span>{activeProjects}</span></div>
                      <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Phase</span><span>{currentPhase}</span></div>
                      <div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Last Contact</span><span>{client.lastContact}</span></div>
                    </div>
                  </Link>
                </div>
              );
            })}
            <button onClick={() => setShowModal(true)} className="border-2 border-dashed border-border rounded-xl h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-colors">
              <span className="material-icons-outlined">add</span><span className="text-sm">New Client</span>
            </button>
          </div>
        ) : (
          <div className="card-base overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="table-header text-left">Client</th><th className="table-header text-left">Company</th><th className="table-header text-left">Projects</th><th className="table-header text-left">Phone</th><th className="table-header text-left">Last Contact</th><th className="table-header text-left">Status</th><th className="table-header w-12" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <tr key={client.id} className="border-b border-border/40 last:border-b-0 hover:bg-muted/15">
                    <td className="table-cell"><Link href={`/crm/clients/${client.id}`} className="hover:underline"><p className="font-medium">{client.primaryContact}</p><p className="text-xs text-muted-foreground">{client.email}</p></Link></td>
                    <td className="table-cell text-muted-foreground">{client.company}</td>
                    <td className="table-cell text-muted-foreground">{client.projects.length}</td>
                    <td className="table-cell text-muted-foreground">{client.phone}</td>
                    <td className="table-cell text-muted-foreground">{client.lastContact}</td>
                    <td className="table-cell"><ClientStatusBadge status={client.status} /></td>
                    <td className="table-cell"><div className="flex gap-1"><Link href={`/crm/clients/${client.id}`} className="p-1 hover:bg-muted rounded text-muted-foreground"><span className="material-icons-outlined" style={{ fontSize: 15 }}>open_in_new</span></Link><PinButton pinned={client.pinned} onToggle={e => { e.preventDefault(); togglePin(client.id); }} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
