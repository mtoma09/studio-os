'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { mockProjects, Project, PROJECT_PHASES, PROJECT_STATUSES, PROJECT_TYPES, formatBudget } from '@/lib/projects-data';
import { mockClients } from '@/lib/crm-data';
import { useDesigners } from '@/lib/designer-context';
import { EmptyState } from '@/components/crm/EmptyState';
import { PinButton } from '@/components/crm/PinButton';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { NewProjectModal, NewProjectData } from '@/components/projects/NewProjectModal';

const SORT_OPTIONS = [
  { label: 'Project Name', value: 'name' },
  { label: 'Last Updated', value: 'updated' },
  { label: 'Created', value: 'created' },
];

const FILTER_PHASES = ['All Phases', ...PROJECT_PHASES];
const FILTER_STATUSES = ['All Statuses', ...PROJECT_STATUSES];
const FILTER_TYPES = ['All Types', ...PROJECT_TYPES];

export default function ProjectsPage() {
  const { designers } = useDesigners();
  const [view, setView] = useState<'card' | 'table'>('card');
  const [showModal, setShowModal] = useState(false);

  // View mode: all vs archived
  const [viewMode, setViewMode] = useState<'all' | 'archived'>('all');

  // Filters
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('All Phases');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [typeFilter, setTypeFilter] = useState('All Types');

  // Sort
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Dropdowns
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [projects, setProjects] = useState(mockProjects);

  const togglePin = (id: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, pinned: !p.pinned } : p)));
  };

  const filtered = useMemo(() => {
    return projects
      .filter((p) => {
        // View mode filter
        if (viewMode === 'archived' && p.status !== 'Archived') return false;
        if (viewMode === 'all' && p.status === 'Archived') return false;

        const client = mockClients.find((c) => c.id === p.clientId);
        const q = search.toLowerCase();

        if (q && ![p.name, p.address, p.projectManager, client?.primaryContact, client?.company]
          .some((f) => f?.toLowerCase().includes(q))) return false;
        if (phaseFilter !== 'All Phases' && p.currentPhase !== phaseFilter) return false;
        if (statusFilter !== 'All Statuses' && p.status !== statusFilter) return false;
        if (typeFilter !== 'All Types' && p.projectType !== typeFilter) return false;

        return true;
      })
      .sort((a, b) => {
        // Pinned first
        const pinDiff = (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
        if (pinDiff !== 0) return pinDiff;

        let valA = '', valB = '';
        if (sortBy === 'name') { valA = a.name; valB = b.name; }
        else if (sortBy === 'updated') { valA = a.updatedAt; valB = b.updatedAt; }
        else if (sortBy === 'created') { valA = a.createdAt; valB = b.createdAt; }

        const cmp = valA.localeCompare(valB);
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [projects, search, phaseFilter, statusFilter, typeFilter, viewMode, sortBy, sortOrder]);

  const hasActiveFilters = phaseFilter !== 'All Phases' || statusFilter !== 'All Statuses' || typeFilter !== 'All Types';
  const activeSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort';

  const clearFilters = () => {
    setSearch('');
    setPhaseFilter('All Phases');
    setStatusFilter('All Statuses');
    setTypeFilter('All Types');
  };

  const handleNewProject = (data: NewProjectData) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name,
      clientId: data.clientId,
      address: data.address,
      projectType: data.projectType,
      description: data.description,
      currentPhase: data.currentPhase,
      phaseProgress: 50,
      status: data.status,
      estimatedBudget: parseInt(data.estimatedBudget.replace(/[^0-9]/g, '')) || 0,
      startDate: data.startDate,
      targetCompletion: data.targetCompletion,
      projectManager: data.projectManager,
      builder: data.builder || null,
      architect: data.architect || null,
      siteNotes: data.siteNotes || null,
      pinned: false,
      coverIndex: Math.floor(Math.random() * 6),
      createdAt: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      updatedAt: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      progress: Math.round((PROJECT_PHASES.indexOf(data.currentPhase) + 1) / PROJECT_PHASES.length * 100),
      team: {
        projectManager: data.projectManager || 'Ellie S.',
        leadDesigner: null,
        supportDesigner: null,
      },
      notes: [],
      timeline: [],
      tasks: [],
    };
    setProjects((prev) => [newProject, ...prev]);
  };

  return (
    <>
      {showModal && <NewProjectModal onClose={() => setShowModal(false)} onSave={handleNewProject} />}

      <div className="space-y-5">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage all interior design projects across your studio.</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Left: All / Archived tabs */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'all' ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('archived')}
              className={`px-3 py-1.5 text-sm border-l border-border transition-colors ${viewMode === 'archived' ? 'bg-muted text-foreground font-medium' : 'text-muted-foreground hover:bg-muted/50'}`}
            >
              Archived
            </button>
          </div>

          <div className="flex-1" />

          {/* Right: Search, Filter, Sort, View toggle, New */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <span className="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: 16 }}>search</span>
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background w-52 placeholder:text-muted-foreground outline-none focus:border-foreground/30 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <span className="material-icons-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              )}
            </div>

            {/* Filter — icon only */}
            <div className="relative">
              <button
                onClick={() => setShowFilterMenu(!showFilterMenu)}
                title="Filter"
                className={`relative flex items-center justify-center w-9 h-9 border rounded-lg transition-colors ${
                  hasActiveFilters ? 'border-foreground/30 bg-muted text-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <span className="material-icons-outlined" style={{ fontSize: 18 }}>filter_list</span>
                {hasActiveFilters && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-foreground" />}
              </button>
              {showFilterMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg z-30 py-2 overflow-hidden">
                    <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Phase</p>
                    {FILTER_PHASES.map(p => (
                      <button key={p} onClick={() => setPhaseFilter(p)}
                        className={`filter-item ${phaseFilter === p ? 'filter-item-active' : 'filter-item-inactive'}`}>
                        {p}{phaseFilter === p && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}
                      </button>
                    ))}
                    <div className="border-t border-border/40 my-1" />
                    <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                    {['All Statuses', 'Active', 'On Hold', 'Completed'].map(s => (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className={`filter-item ${statusFilter === s ? 'filter-item-active' : 'filter-item-inactive'}`}>
                        {s}{statusFilter === s && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}
                      </button>
                    ))}
                    <div className="border-t border-border/40 my-1" />
                    <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Type</p>
                    {FILTER_TYPES.map(t => (
                      <button key={t} onClick={() => setTypeFilter(t)}
                        className={`filter-item ${typeFilter === t ? 'filter-item-active' : 'filter-item-inactive'}`}>
                        {t}{typeFilter === t && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}
                      </button>
                    ))}
                    {hasActiveFilters && (
                      <div className="border-t border-border/40 px-3 pt-2 pb-1">
                        <button onClick={() => { clearFilters(); setShowFilterMenu(false); }} className="text-xs text-muted-foreground hover:text-foreground">Clear filters</button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Sort — icon only */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                title="Sort"
                className="flex items-center justify-center w-9 h-9 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <span className="material-icons-outlined" style={{ fontSize: 18 }}>list_arrow</span>
              </button>
              {showSortMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
                  <div className="absolute right-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg z-30 py-1">
                    <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Sort By</p>
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                        className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${sortBy === opt.value ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                      >
                        {opt.label}
                        {sortBy === opt.value && <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>}
                      </button>
                    ))}
                    <div className="border-t border-border my-1" />
                    <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Order</p>
                    <button
                      onClick={() => { setSortOrder('asc'); setShowSortMenu(false); }}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${sortOrder === 'asc' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                    >
                      Ascending
                      {sortOrder === 'asc' && <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>}
                    </button>
                    <button
                      onClick={() => { setSortOrder('desc'); setShowSortMenu(false); }}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${sortOrder === 'desc' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                    >
                      Descending
                      {sortOrder === 'desc' && <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* View toggle */}
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setView('card')}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === 'card' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                title="Card view"
              >
                <span className="material-icons-outlined" style={{ fontSize: 15 }}>grid_view</span>
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 border-l border-border transition-colors ${view === 'table' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
                title="Table view"
              >
                <span className="material-icons-outlined" style={{ fontSize: 15 }}>table_rows</span>
              </button>
            </div>

            {/* New Project */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
            >
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
              New Project
            </button>
          </div>
        </div>

        {/* Content */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="folder"
            title={viewMode === 'archived' ? 'No archived projects' : (search || hasActiveFilters ? 'No projects match your filters' : 'No projects yet')}
            description={search || hasActiveFilters ? 'Try adjusting your search or filters.' : viewMode === 'archived' ? 'Archived projects will appear here.' : 'Create your first project to get started.'}
            action={viewMode === 'all' ? { label: '+ New Project', onClick: () => setShowModal(true) } : undefined}
          />
        ) : view === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} onPin={() => togglePin(project.id)} />
            ))}
            {viewMode === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="border-2 border-dashed border-border rounded-xl h-56 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <span className="material-icons-outlined">add</span>
                <span className="text-sm">New Project</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="table-header text-left">Project</th>
                  <th className="table-header text-left">Client</th>
                  <th className="table-header text-left">Phase</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-left">Manager</th>
                  <th className="table-header text-right">Budget</th>
                  <th className="table-header text-left">Target</th>
                  <th className="table-header w-12" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => {
                  const client = mockClients.find((c) => c.id === project.clientId);
                  return (
                    <tr key={project.id} className="hover:bg-muted/20 cursor-pointer border-b border-border/50 last:border-b-0">
                      <td className="table-cell">
                        <Link href={`/projects/${project.id}`} className="hover:underline">
                          <p className="font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{project.address}</p>
                        </Link>
                      </td>
                      <td className="table-cell text-muted-foreground">{client?.primaryContact || '—'}</td>
                      <td className="table-cell text-muted-foreground">{project.currentPhase}</td>
                      <td className="table-cell"><ProjectStatusBadge status={project.status} /></td>
                      <td className="table-cell text-muted-foreground">{project.projectManager}</td>
                      <td className="table-cell text-right text-muted-foreground">{formatBudget(project.estimatedBudget)}</td>
                      <td className="table-cell text-muted-foreground">{project.targetCompletion}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <Link href={`/projects/${project.id}`} className="p-1 hover:bg-muted rounded text-muted-foreground">
                            <span className="material-icons-outlined" style={{ fontSize: 15 }}>open_in_new</span>
                          </Link>
                          <PinButton pinned={project.pinned} onToggle={(e) => { e.preventDefault(); togglePin(project.id); }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
