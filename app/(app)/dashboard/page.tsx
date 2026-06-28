'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { mockProjects, PROJECT_PHASES, Project } from '@/lib/projects-data';
import { mockClients } from '@/lib/crm-data';
import { NewProjectModal, NewProjectData } from '@/components/projects/NewProjectModal';
import { NewLeadModal } from '@/components/crm/NewLeadModal';
import { SidePanel } from '@/components/ui/SidePanel';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';

interface DashTask {
  id: string;
  title: string;
  project: string;
  due: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
}

const INITIAL_TASKS: DashTask[] = [
  { id: '1', title: 'Kitchen Layout Review', project: 'Hampton Residence', due: 'Today', priority: 'High', completed: false },
  { id: '2', title: 'Material Board Presentation', project: 'Darling Point Apartment', due: 'Tomorrow', priority: 'Medium', completed: false },
  { id: '3', title: 'Site Measure', project: 'Vaucluse House', due: '28 Jun', priority: 'Low', completed: false },
  { id: '4', title: 'Client Brief Sign-Off', project: 'Mosman Terrace', due: '30 Jun', priority: 'High', completed: false },
  { id: '5', title: 'FF&E Schedule Draft', project: 'Rose Bay Villa', due: '2 Jul', priority: 'Medium', completed: false },
];

const priorityColors: Record<string, string> = {
  High: 'text-red-600 dark:text-red-400',
  Medium: 'text-amber-600 dark:text-amber-400',
  Low: 'text-muted-foreground',
};

const STATUS_OPTIONS = ['All Statuses', 'Active', 'On Hold', 'Completed'];

export default function DashboardPage() {
  const [projects, setProjects] = useState(mockProjects);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewLead, setShowNewLead] = useState(false);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [tasks, setTasks] = useState<DashTask[]>(INITIAL_TASKS);

  // Filter state
  const [filterPhase, setFilterPhase] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const activeProjects = useMemo(() =>
    projects
      .filter((p) => p.status !== 'Archived')
      .filter((p) => filterPhase === 'All' || p.currentPhase === filterPhase)
      .filter((p) => filterStatus === 'All Statuses' || p.status === filterStatus)
      .slice(0, 6)
      .map((p) => ({ ...p, client: mockClients.find((c) => c.id === p.clientId) })),
    [projects, filterPhase, filterStatus]
  );

  const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 5);

  const kpis = useMemo(() => [
    { label: 'Active Projects', value: projects.filter(p => p.status === 'Active').length.toString(), icon: 'folder_open', change: '+2 this month' },
    { label: 'Pending Tasks', value: tasks.filter(t => !t.completed).length.toString(), icon: 'checklist', change: '2 due today' },
    { label: 'New Leads', value: '3', icon: 'person_add', change: 'This week' },
    { label: 'Revenue (MTD)', value: 'A$48,000', icon: 'account_balance_wallet', change: '+12% vs last month' },
  ], [projects, tasks]);

  const hasActiveFilter = filterPhase !== 'All' || filterStatus !== 'All Statuses';

  const handleNewProject = (data: NewProjectData) => {
    const { PROJECT_PHASES } = require('@/lib/projects-data');
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name,
      clientId: data.clientId,
      address: data.address,
      projectType: data.projectType,
      description: data.description,
      currentPhase: data.currentPhase,
      phaseProgress: 0,
      status: data.status,
      estimatedBudget: parseInt(data.estimatedBudget.replace(/[^0-9]/g, '')) || 0,
      startDate: data.startDate,
      targetCompletion: data.targetCompletion,
      projectManager: data.projectManager,
      builder: data.builder || null,
      architect: data.architect || null,
      siteNotes: data.siteNotes || null,
      pinned: false,
      coverIndex: 0,
      createdAt: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      updatedAt: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
      progress: 0,
      team: { projectManager: data.projectManager || 'Ellie S.', leadDesigner: null, supportDesigner: null },
      notes: [],
      timeline: [],
      tasks: [],
    };
    setProjects(prev => [newProject, ...prev]);
    setShowNewProject(false);
  };

  return (
    <>
      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onSave={handleNewProject} />}
      {showNewLead && <NewLeadModal onClose={() => setShowNewLead(false)} />}
      {showNewInvoice && (
        <SidePanel title="New Invoice" onClose={() => setShowNewInvoice(false)} footer={
          <><div /><div className="flex gap-2">
            <button onClick={() => setShowNewInvoice(false)} className="notion-button border border-border">Cancel</button>
            <button onClick={() => setShowNewInvoice(false)} className="btn-primary">Create Invoice</button>
          </div></>
        }>
          <div className="px-6 py-5">
            <p className="text-sm text-muted-foreground">Invoice creation will be available in a future phase of StudioOS.</p>
          </div>
        </SidePanel>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Welcome back, Ellie.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNewProject(true)} className="btn-primary">
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
              New Project
            </button>
            <button onClick={() => setShowNewLead(true)} className="notion-button border border-border/60 bg-card/80">
              <span className="material-icons-outlined" style={{ fontSize: 15 }}>person_add</span>
              Add Lead
            </button>
            <button onClick={() => setShowNewInvoice(true)} className="notion-button border border-border/60 bg-card/80">
              <span className="material-icons-outlined" style={{ fontSize: 15 }}>receipt_long</span>
              New Invoice
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="kpi-card">
              <div className="mb-3">
                <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 20 }}>{kpi.icon}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{kpi.change}</p>
            </div>
          ))}
        </div>

        {/* Active Projects */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Active Projects</h2>
            <div className="flex items-center gap-2">
              {/* Filter icon-only — shows phases */}
              <div className="relative">
                <button onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }} title="Filter by phase"
                  className={`relative flex items-center justify-center w-8 h-8 border rounded-lg transition-colors ${
                    filterPhase !== 'All' ? 'border-foreground/30 bg-card text-foreground' : 'border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}>
                  <span className="material-icons-outlined" style={{ fontSize: 17 }}>filter_list</span>
                  {filterPhase !== 'All' && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-foreground" />}
                </button>
                {showFilterMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)} />
                    <div className="absolute right-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg z-30 py-2 overflow-hidden">
                      <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Phase</p>
                      {['All', ...PROJECT_PHASES].map((opt) => (
                        <button key={opt} onClick={() => { setFilterPhase(opt); setShowFilterMenu(false); }}
                          className={`filter-item ${filterPhase === opt ? 'filter-item-active' : 'filter-item-inactive'}`}>
                          {opt}
                          {filterPhase === opt && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Sort icon-only — shows status */}
              <div className="relative">
                <button onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }} title="Sort by status"
                  className={`relative flex items-center justify-center w-8 h-8 border rounded-lg transition-colors ${
                    filterStatus !== 'All Statuses' ? 'border-foreground/30 bg-card text-foreground' : 'border-border/60 bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}>
                  <span className="material-icons-outlined" style={{ fontSize: 17 }}>sort</span>
                  {filterStatus !== 'All Statuses' && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-foreground" />}
                </button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
                    <div className="absolute right-0 mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg z-30 py-2 overflow-hidden">
                      <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Status</p>
                      {STATUS_OPTIONS.map((opt) => (
                        <button key={opt} onClick={() => { setFilterStatus(opt); setShowSortMenu(false); }}
                          className={`filter-item ${filterStatus === opt ? 'filter-item-active' : 'filter-item-inactive'}`}>
                          {opt}
                          {filterStatus === opt && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {hasActiveFilter && (
                <button onClick={() => { setFilterPhase('All'); setFilterStatus('All Statuses'); }}
                  className="text-xs text-muted-foreground hover:text-foreground">
                  Clear
                </button>
              )}

              <Link href="/projects" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all
              </Link>
            </div>
          </div>

          <div className="card-base overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="table-header text-left">Project</th>
                  <th className="table-header text-left">Client</th>
                  <th className="table-header text-left">Phase</th>
                  <th className="table-header text-left">Status</th>
                  <th className="table-header text-right">Progress</th>
                </tr>
              </thead>
              <tbody>
                {activeProjects.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No projects match current filters</td>
                  </tr>
                ) : (
                  activeProjects.map((project) => (
                    <tr key={project.id}
                      className="border-b border-border/40 last:border-b-0 hover:bg-muted/15 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/projects/${project.id}`}>
                      <td className="table-cell">
                        <p className="font-medium text-sm">{project.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">{project.address}</p>
                      </td>
                      <td className="table-cell text-sm text-muted-foreground">{project.client?.primaryContact || '—'}</td>
                      <td className="table-cell text-sm text-muted-foreground">{project.currentPhase}</td>
                      <td className="table-cell"><ProjectStatusBadge status={project.status} /></td>
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-foreground/40 rounded-full transition-all" style={{ width: `${project.progress}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{project.progress}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Upcoming Tasks — full width */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Upcoming Tasks</h2>
            <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</Link>
          </div>
          <div className="card-base overflow-hidden">
            {upcomingTasks.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">All tasks complete!</p>
            ) : (
              upcomingTasks.map((task, i) => (
                <Link key={task.id} href="/tasks"
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors ${i < upcomingTasks.length - 1 ? 'border-b border-border/40' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.project}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>{task.priority}</span>
                    <span className="text-xs text-muted-foreground w-16 text-right">{task.due}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
