'use client';

import { useState, useMemo } from 'react';
import { SidePanel } from '@/components/ui/SidePanel';

interface Task {
  id: string;
  title: string;
  project: string;
  due: string;
  dueDate: Date;
  priority: 'High' | 'Medium' | 'Low';
  status: 'To Do' | 'In Progress' | 'Review' | 'Done';
  completed: boolean;
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
const d = (offset: number) => { const d = new Date(today); d.setDate(today.getDate() + offset); return d; };

const INITIAL_TASKS: Task[] = [
  { id: '1', title: 'Kitchen Layout Review', project: 'Hampton Residence', due: 'Today', dueDate: today, priority: 'High', status: 'In Progress', completed: false },
  { id: '2', title: 'Material Board Presentation', project: 'Darling Point Apartment', due: 'Tomorrow', dueDate: tomorrow, priority: 'Medium', status: 'To Do', completed: false },
  { id: '3', title: 'Site Measure', project: 'Vaucluse House', due: '28 Jun', dueDate: d(1), priority: 'Low', status: 'To Do', completed: false },
  { id: '4', title: 'Client Brief Sign-Off', project: 'Mosman Terrace', due: '30 Jun', dueDate: d(3), priority: 'High', status: 'Review', completed: false },
  { id: '5', title: 'FF&E Schedule Draft', project: 'Rose Bay Villa', due: '2 Jul', dueDate: d(5), priority: 'Medium', status: 'In Progress', completed: false },
  { id: '6', title: 'Concept Presentation Prep', project: 'Woollahra Studio', due: '4 Jul', dueDate: d(7), priority: 'High', status: 'Done', completed: false },
  { id: '7', title: 'Invoice Follow-up', project: 'Darling Point Apartment', due: '22 Jun', dueDate: d(-5), priority: 'High', status: 'To Do', completed: false },
];

const PRIORITY_COLORS: Record<string, string> = {
  High: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  Medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  Low: 'text-muted-foreground bg-muted',
};
const STATUS_COLORS: Record<string, string> = {
  'To Do': 'text-muted-foreground bg-muted',
  'In Progress': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  'Review': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  'Done': 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
};
const KANBAN_COLUMNS = ['To Do', 'In Progress', 'Review', 'Done'] as const;
const PROJECTS = ['All', 'Hampton Residence', 'Darling Point Apartment', 'Vaucluse House', 'Mosman Terrace', 'Rose Bay Villa', 'Woollahra Studio'];
const STATUSES = ['All', 'To Do', 'In Progress', 'Review', 'Done'];
const PRIORITIES = ['All', 'High', 'Medium', 'Low'];

function getDueGroup(task: Task): string {
  const diff = Math.floor((task.dueDate.getTime() - today.getTime()) / 86400000);
  if (task.completed) return 'Completed';
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Due Today';
  if (diff <= 3) return 'Due Soon';
  return 'Upcoming';
}

const DUE_GROUP_ORDER = ['Overdue', 'Due Today', 'Due Soon', 'Upcoming', 'Completed'];
const DUE_GROUP_COLORS: Record<string, string> = {
  Overdue: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  'Due Today': 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
  'Due Soon': 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  Upcoming: 'text-muted-foreground bg-muted',
  Completed: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [view, setView] = useState<'table' | 'kanban'>('table');
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('due');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // New task form
  const [newTask, setNewTask] = useState({ title: '', project: '', priority: 'Medium' as Task['priority'], status: 'To Do' as Task['status'], due: '' });

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed, status: !t.completed ? 'Done' : 'To Do' } : t));
  };

  const saveEdit = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditingTask(null);
  };

  const addTask = () => {
    if (!newTask.title) return;
    const dueDate = newTask.due ? new Date(newTask.due) : d(7);
    const created: Task = {
      id: `t-${Date.now()}`,
      title: newTask.title,
      project: newTask.project,
      due: newTask.due || '—',
      dueDate,
      priority: newTask.priority,
      status: newTask.status,
      completed: false,
    };
    setTasks(prev => [...prev, created]);
    setNewTask({ title: '', project: '', priority: 'Medium', status: 'To Do', due: '' });
    setShowAddPanel(false);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter(t => {
      if (q && !t.title.toLowerCase().includes(q) && !t.project.toLowerCase().includes(q)) return false;
      if (filterProject !== 'All' && t.project !== filterProject) return false;
      if (filterStatus !== 'All' && t.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => {
      let va = 0, vb = 0;
      if (sortBy === 'due') { va = a.dueDate.getTime(); vb = b.dueDate.getTime(); }
      else if (sortBy === 'priority') {
        const order = { High: 0, Medium: 1, Low: 2 };
        va = order[a.priority]; vb = order[b.priority];
      }
      return sortOrder === 'asc' ? va - vb : vb - va;
    });
  }, [tasks, search, filterProject, filterStatus, sortBy, sortOrder]);

  const hasFilters = filterProject !== 'All' || filterStatus !== 'All';

  // Group for table view
  const groups = useMemo(() => {
    const map: Record<string, Task[]> = {};
    filtered.forEach(t => {
      const g = getDueGroup(t);
      if (!map[g]) map[g] = [];
      map[g].push(t);
    });
    return DUE_GROUP_ORDER.filter(g => map[g]?.length > 0).map(g => ({ group: g, tasks: map[g] }));
  }, [filtered]);

  return (
    <>
      {/* Edit panel */}
      {editingTask && (
        <SidePanel title="Edit Task" onClose={() => setEditingTask(null)} footer={
          <><div /><div className="flex gap-2">
            <button onClick={() => setEditingTask(null)} className="notion-button border border-border">Cancel</button>
            <button onClick={() => saveEdit(editingTask)} className="btn-primary">Save</button>
          </div></>
        }>
          <div className="px-6 py-5 space-y-4">
            <div><label className="block text-xs text-muted-foreground mb-1.5">Task Name</label>
              <input value={editingTask.title} onChange={e => setEditingTask(p => p && ({ ...p, title: e.target.value }))} className="modal-input" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1.5">Project</label>
              <input value={editingTask.project} onChange={e => setEditingTask(p => p && ({ ...p, project: e.target.value }))} className="modal-input" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1.5">Priority</label>
              <div className="flex gap-2">{PRIORITIES.filter(p => p !== 'All').map(p => (
                <button key={p} onClick={() => setEditingTask(prev => prev && ({ ...prev, priority: p as Task['priority'] }))}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${editingTask.priority === p ? 'border-foreground bg-muted font-medium' : 'border-border text-muted-foreground hover:bg-muted/30'}`}>{p}</button>
              ))}</div></div>
            <div><label className="block text-xs text-muted-foreground mb-1.5">Status</label>
              <div className="grid grid-cols-2 gap-2">{STATUSES.filter(s => s !== 'All').map(s => (
                <button key={s} onClick={() => setEditingTask(prev => prev && ({ ...prev, status: s as Task['status'] }))}
                  className={`py-2 text-xs rounded-lg border transition-colors ${editingTask.status === s ? 'border-foreground bg-muted font-medium' : 'border-border text-muted-foreground hover:bg-muted/30'}`}>{s}</button>
              ))}</div></div>
            <div><label className="block text-xs text-muted-foreground mb-1.5">Due Date</label>
              <input value={editingTask.due} onChange={e => setEditingTask(p => p && ({ ...p, due: e.target.value }))} className="modal-input" /></div>
          </div>
        </SidePanel>
      )}

      {/* Add task panel */}
      {showAddPanel && (
        <SidePanel title="New Task" onClose={() => setShowAddPanel(false)} footer={
          <><div /><div className="flex gap-2">
            <button onClick={() => setShowAddPanel(false)} className="notion-button border border-border">Cancel</button>
            <button onClick={addTask} className="btn-primary">Add Task</button>
          </div></>
        }>
          <div className="px-6 py-5 space-y-4">
            <div><label className="block text-xs text-muted-foreground mb-1.5">Task Name *</label>
              <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Kitchen Layout Review" className="modal-input" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1.5">Project</label>
              <input value={newTask.project} onChange={e => setNewTask(p => ({ ...p, project: e.target.value }))} placeholder="e.g. Hampton Residence" className="modal-input" /></div>
            <div><label className="block text-xs text-muted-foreground mb-1.5">Priority</label>
              <div className="flex gap-2">{PRIORITIES.filter(p => p !== 'All').map(p => (
                <button key={p} onClick={() => setNewTask(prev => ({ ...prev, priority: p as Task['priority'] }))}
                  className={`flex-1 py-2 text-xs rounded-lg border transition-colors ${newTask.priority === p ? 'border-foreground bg-muted font-medium' : 'border-border text-muted-foreground hover:bg-muted/30'}`}>{p}</button>
              ))}</div></div>
            <div><label className="block text-xs text-muted-foreground mb-1.5">Status</label>
              <div className="grid grid-cols-2 gap-2">{STATUSES.filter(s => s !== 'All').map(s => (
                <button key={s} onClick={() => setNewTask(prev => ({ ...prev, status: s as Task['status'] }))}
                  className={`py-2 text-xs rounded-lg border transition-colors ${newTask.status === s ? 'border-foreground bg-muted font-medium' : 'border-border text-muted-foreground hover:bg-muted/30'}`}>{s}</button>
              ))}</div></div>
            <div><label className="block text-xs text-muted-foreground mb-1.5">Due Date</label>
              <input type="date" value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))} className="modal-input" /></div>
          </div>
        </SidePanel>
      )}

      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{tasks.filter(t => !t.completed).length} tasks remaining</p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex-1" />

          <div className="relative">
            <span className="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: 16 }}>search</span>
            <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
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
                  <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Project</p>
                  {PROJECTS.map(opt => <button key={opt} onClick={() => setFilterProject(opt)} className={`filter-item ${filterProject === opt ? 'filter-item-active' : 'filter-item-inactive'}`}>{opt}{filterProject === opt && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}</button>)}
                  <div className="border-t border-border/40 my-1" />
                  <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</p>
                  {STATUSES.map(opt => <button key={opt} onClick={() => setFilterStatus(opt)} className={`filter-item ${filterStatus === opt ? 'filter-item-active' : 'filter-item-inactive'}`}>{opt}{filterStatus === opt && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}</button>)}
                  {hasFilters && <div className="border-t border-border/40 px-3 pt-2 pb-1"><button onClick={() => { setFilterProject('All'); setFilterStatus('All'); }} className="text-xs text-muted-foreground hover:text-foreground">Clear</button></div>}
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
                  {[{l:'Priority',v:'priority'},{l:'Due Date',v:'due'},{l:'Created',v:'created'}].map(opt => (
                    <button key={opt.v} onClick={() => { setSortBy(opt.v); setShowSortMenu(false); }}
                      className={`filter-item ${sortBy === opt.v ? 'filter-item-active' : 'filter-item-inactive'}`}>{opt.l}{sortBy === opt.v && <span className="material-icons-outlined" style={{ fontSize: 13 }}>check</span>}</button>
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
            <button onClick={() => setView('table')} className={`px-2.5 py-1.5 flex items-center transition-colors ${view === 'table' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`} title="Table">
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>table_rows</span>
            </button>
            <button onClick={() => setView('kanban')} className={`px-2.5 py-1.5 flex items-center border-l border-border transition-colors ${view === 'kanban' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`} title="Kanban">
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>view_kanban</span>
            </button>
          </div>

          <button onClick={() => setShowAddPanel(true)} className="btn-primary">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
            Add Task
          </button>
        </div>

        {/* Table View */}
        {view === 'table' && (
          <div>
            {groups.length === 0 && (
              <div className="text-center py-12 text-muted-foreground card-base">
                <span className="material-icons-outlined block mb-2" style={{ fontSize: 32 }}>checklist</span>
                <p className="text-sm">No tasks match your filters</p>
              </div>
            )}
            {groups.map(({ group, tasks: groupTasks }) => (
              <div key={group} className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${DUE_GROUP_COLORS[group]}`}>{group}</span>
                  <span className="text-xs text-muted-foreground">{groupTasks.length}</span>
                </div>
                <div className="card-base overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/15">
                        <th className="w-10 px-3 py-2.5" />
                        <th className="table-header text-left">Task</th>
                        <th className="table-header text-left">Project</th>
                        <th className="table-header text-left">Priority</th>
                        <th className="table-header text-left">Status</th>
                        <th className="table-header text-left">Due</th>
                        <th className="w-20" />
                      </tr>
                    </thead>
                    <tbody>
                      {groupTasks.map(task => (
                        <tr key={task.id}
                          className="border-b border-border/40 last:border-b-0 hover:bg-muted/10 transition-colors"
                          onMouseEnter={() => setHoveredId(task.id)}
                          onMouseLeave={() => setHoveredId(null)}>
                          <td className="px-3 py-3">
                            <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id)}
                              className="w-4 h-4 rounded border-border cursor-pointer accent-foreground" />
                          </td>
                          <td className="table-cell">
                            <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</span>
                          </td>
                          <td className="table-cell text-muted-foreground text-sm">{task.project}</td>
                          <td className="table-cell"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span></td>
                          <td className="table-cell"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[task.status]}`}>{task.status}</span></td>
                          <td className="table-cell text-sm text-muted-foreground">{task.due}</td>
                          <td className="px-3 py-2 text-right">
                            <button onClick={() => setEditingTask(task)}
                              className={`text-xs px-2 py-1 border border-border rounded-lg hover:bg-muted transition-all text-muted-foreground hover:text-foreground ${hoveredId === task.id ? 'opacity-100' : 'opacity-0'}`}>
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Kanban View */}
        {view === 'kanban' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {KANBAN_COLUMNS.map(col => {
              const colTasks = filtered.filter(t => t.status === col);
              return (
                <div key={col} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[col]}`}>{col}</span>
                    <span className="text-xs text-muted-foreground">{colTasks.length}</span>
                  </div>
                  {colTasks.map(task => (
                    <div key={task.id} className="card-base card-hover p-3 group">
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={task.completed} onChange={() => toggleComplete(task.id)}
                          className="w-3.5 h-3.5 rounded mt-0.5 border-border cursor-pointer accent-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium mb-1 leading-tight ${task.completed ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                          <p className="text-xs text-muted-foreground mb-2">{task.project}</p>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${DUE_GROUP_COLORS[getDueGroup(task)]}`}>{task.due}</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => setEditingTask(task)}
                        className="mt-2 w-full text-xs py-1 border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100">
                        Edit
                      </button>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-xl h-16 flex items-center justify-center text-xs text-muted-foreground">No tasks</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
