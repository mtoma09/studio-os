'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Filter, Plus, Calendar, X, Ellipsis as MoreHorizontal, Pencil, Trash2, GripVertical, Check, ChevronDown } from 'lucide-react';
import { Project, PROJECT_PHASES } from '@/lib/projects-data';
import { Task, TaskStatus } from '@/lib/crm-data';
import { SidePanel } from '@/components/ui/SidePanel';
import { DatePicker } from '@/components/ui/DatePicker';

interface PlannerTabProps {
  project: Project;
  onUpdateTasks: (tasks: Task[]) => void;
}

const STATUSES: TaskStatus[] = ['To do', 'In Progress', 'Waiting', 'Done'];

const statusColors: Record<TaskStatus, string> = {
  'To do': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-blue-50 text-blue-700 border border-blue-200',
  'Waiting': 'bg-amber-50 text-amber-700 border border-amber-200',
  'Done': 'bg-green-50 text-green-700 border border-green-200',
};

type ViewMode = 'progress' | 'phase';

// ── Task Card Menu ─────────────────────────────────────────────────────────
interface TaskMenuProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
}
function TaskMenu({ task, onEdit, onDelete }: TaskMenuProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('scroll', () => setOpen(false), true);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('scroll', () => setOpen(false), true); };
  }, []);
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(!open);
  };
  const close = () => setOpen(false);
  if (!open || !rect) {
    return (
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <MoreHorizontal size={14} />
      </button>
    );
  }
  const top = rect.bottom + 4;
  const left = Math.min(rect.right - 144, window.innerWidth - 160);
  return createPortal(
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted/80 transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <MoreHorizontal size={14} />
      </button>
      <div className="fixed inset-0 z-[60]" style={{ overflow: 'hidden' }} onClick={close} />
      <div
        className="fixed z-[61] w-36 bg-popover border border-border rounded-xl shadow-lg py-1 overflow-hidden"
        style={{ top, left }}
      >
        <button onClick={() => { close(); onEdit(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground">
          <Pencil size={14} className="text-muted-foreground" />
          Edit
        </button>
        <button onClick={() => { close(); onDelete(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-red-50 transition-colors text-red-600">
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </>,
    document.body
  );
}

// ── Edit Task Side Panel ────────────────────────────────────────────────────
interface EditTaskPanelProps {
  task: Task;
  project: Project;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (id: string) => void;
}
function EditTaskPanel({ task, project, onClose, onSave, onDelete }: EditTaskPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState<TaskStatus>(task.status || (task.completed ? 'Done' : 'To do'));
  const [phase, setPhase] = useState(task.phase || project.currentPhase);
  const [dueDate, setDueDate] = useState(task.dueDate || '');

  const [statusOpen, setStatusOpen] = useState(false);
  const [phaseOpen, setPhaseOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (phaseRef.current && !phaseRef.current.contains(e.target as Node)) setPhaseOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const canSave = title.trim();
  const handleSave = () => {
    if (!canSave) return;
    onSave({ ...task, title: title.trim(), description, status, phase, dueDate, completed: status === 'Done' });
  };

  return (
    <SidePanel
      subtitle={task.title}
      onClose={onClose}
      width="min(40vw, 520px)"
      footer={
        <>
          <button
            onClick={() => { onDelete(task.id); onClose(); }}
            className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors"
          >
            <Trash2 size={14} />
            Delete Task
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="notion-button border border-border">Cancel</button>
            <button onClick={handleSave} disabled={!canSave} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Save Changes
            </button>
          </div>
        </>
      }
    >
      <div className="px-6 py-5 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Task Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="modal-input" autoFocus />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add more details..." rows={4} className="modal-input resize-none" />
        </div>

        {/* Status dropdown */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Progress</label>
          <div className="relative" ref={statusRef}>
            <button
              onClick={() => { setStatusOpen(!statusOpen); setPhaseOpen(false); }}
              className="notion-button border border-border w-full justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>{status}</span>
              </span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            {statusOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setStatusOpen(false)} />
                <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => { setStatus(s); setStatusOpen(false); }}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors whitespace-nowrap"
                    >
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s]}`}>{s}</span>
                      {status === s && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Phase dropdown */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Phase</label>
          <div className="relative" ref={phaseRef}>
            <button
              onClick={() => { setPhaseOpen(!phaseOpen); setStatusOpen(false); }}
              className="notion-button border border-border w-full justify-between text-sm"
            >
              <span>{phase}</span>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            {phaseOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setPhaseOpen(false)} />
                <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  {PROJECT_PHASES.map(p => (
                    <button
                      key={p}
                      onClick={() => { setPhase(p); setPhaseOpen(false); }}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors whitespace-nowrap"
                    >
                      {p}
                      {phase === p && <Check size={14} />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Due date */}
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Due Date</label>
          <DatePicker
            value={dueDate}
            onChange={(v) => setDueDate(v)}
            placeholder="Select date"
          />
        </div>
      </div>
    </SidePanel>
  );
}

// ── Draggable Task Card ─────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}
function TaskCard({ task, onEdit, onDelete, onDragStart, onDragEnter, onDragEnd, isDragging }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
      className={`card-base p-3 cursor-grab active:cursor-grabbing group/task transition-opacity ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight flex-1 min-w-0">{task.title}</p>
        <TaskMenu task={task} onEdit={onEdit} onDelete={onDelete} />
      </div>
      {task.description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
      )}
      {task.phase && (
        <p className="text-xs text-muted-foreground mt-1 truncate">{task.phase}</p>
      )}
      {task.dueDate && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Calendar size={11} />
          {task.dueDate}
        </div>
      )}
    </div>
  );
}

export function PlannerTab({ project, onUpdateTasks }: PlannerTabProps) {
  const [view, setView] = useState<ViewMode>('progress');
  const [search, setSearch] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | null>(null);
  const [phaseFilter, setPhaseFilter] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState<{ status: TaskStatus; title: string } | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const newTaskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilter(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (addingTask) newTaskInputRef.current?.focus();
  }, [addingTask]);

  const tasks = project.tasks || [];

  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter(t => {
      const matchSearch = !search || t.title.toLowerCase().includes(q);
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchPhase = !phaseFilter || t.phase === phaseFilter;
      return matchSearch && matchStatus && matchPhase;
    });
  }, [tasks, search, statusFilter, phaseFilter]);

  const activeFilterCount = (statusFilter ? 1 : 0) + (phaseFilter ? 1 : 0);
  const clearFilters = () => { setStatusFilter(null); setPhaseFilter(null); };

  const commitNewTask = () => {
    if (!addingTask || !addingTask.title.trim()) { setAddingTask(null); return; }
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: addingTask.title.trim(),
      completed: addingTask.status === 'Done',
      status: addingTask.status,
      phase: (addingTask as any).phase || project.currentPhase,
    };
    onUpdateTasks([...tasks, newTask]);
    setAddingTask(null);
  };

  const handleSaveTask = (updated: Task) => {
    onUpdateTasks(tasks.map(t => t.id === updated.id ? updated : t));
    setEditingTask(null);
  };

  const handleDeleteTask = (id: string) => {
    onUpdateTasks(tasks.filter(t => t.id !== id));
  };

  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnterCol = (status: TaskStatus) => {
    setDragOverStatus(status);
    if (!draggedId) return;
    const updated = tasks.map(t => t.id === draggedId ? { ...t, status, completed: status === 'Done' } : t);
    onUpdateTasks(updated);
  };
  const handleDragEnd = () => { setDraggedId(null); setDragOverStatus(null); };

  // Reorder within a column
  const handleCardDragEnter = (id: string) => {
    if (!draggedId || draggedId === id) return;
    const fromIdx = tasks.findIndex(t => t.id === draggedId);
    const toIdx = tasks.findIndex(t => t.id === id);
    if (fromIdx === -1 || toIdx === -1) return;
    const updated = [...tasks];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    onUpdateTasks(updated);
  };

  // ── Kanban ──────────────────────────────────────────────────────────────
  const renderKanban = () => {
    const columns: Record<TaskStatus, Task[]> = { 'To do': [], 'In Progress': [], 'Waiting': [], 'Done': [] };
    filteredTasks.forEach(t => {
      const s = t.status || (t.completed ? 'Done' : 'To do');
      if (columns[s]) columns[s].push(t);
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map(status => (
          <div
            key={status}
            className="flex flex-col"
            onDragEnter={() => handleDragEnterCol(status)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDragEnd}
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>{status}</span>
                <span className="text-xs text-muted-foreground">{columns[status].length}</span>
              </div>
              <button
                onClick={() => setAddingTask(addingTask?.status === status ? null : { status, title: '' })}
                className="flex items-center gap-1 h-6 px-2 rounded text-xs font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <Plus size={14} />
                Add New Task
              </button>
            </div>

            {/* Column body */}
            <div className={`flex-1 space-y-2 min-h-[120px] bg-muted/20 rounded-xl p-2 transition-colors ${dragOverStatus === status && draggedId ? 'ring-2 ring-foreground/20' : ''}`}>
              {columns[status].map(task => (
                <div key={task.id} className="relative">
                  {/* Grip handle */}
                  <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 cursor-grab opacity-0 group-hover/task:opacity-100 transition-opacity z-10">
                    <GripVertical size={12} />
                  </div>
                  <TaskCard
                    task={task}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnter={() => handleCardDragEnter(task.id)}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedId === task.id}
                  />
                </div>
              ))}

              {/* Inline add task form */}
              {addingTask?.status === status && (
                <div className="card-base p-2">
                  <input
                    ref={newTaskInputRef}
                    value={addingTask.title}
                    onChange={e => setAddingTask({ ...addingTask, title: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') commitNewTask(); if (e.key === 'Escape') setAddingTask(null); }}
                    placeholder="Task title..."
                    className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground/60"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    <button onClick={commitNewTask} className="text-xs px-2 py-1 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors">
                      Add
                    </button>
                    <button onClick={() => setAddingTask(null)} className="text-xs px-2 py-1 rounded-md hover:bg-muted transition-colors text-muted-foreground">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {columns[status].length === 0 && !addingTask && (
                <p className="text-xs text-muted-foreground/60 text-center py-6">No tasks</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ── Phase View (current phase on top) ─────────────────────────────────────
  const renderPhaseView = () => {
    const usedPhases = Array.from(new Set([...PROJECT_PHASES, ...tasks.map(t => t.phase).filter(Boolean) as string[]]));
    // Sort: current phase first, then the rest in PROJECT_PHASES order, then any custom
    const phases = [
      project.currentPhase,
      ...usedPhases.filter(p => p !== project.currentPhase),
    ];
    const seen = new Set<string>();
    const orderedPhases = phases.filter(p => { if (seen.has(p)) return false; seen.add(p); return true; });

    return (
      <div className="space-y-4">
        {orderedPhases.map(phase => {
          const items = filteredTasks.filter(t => (t.phase || 'Unassigned') === phase);
          const isCurrent = phase === project.currentPhase;
          return (
            <div key={phase} className={`card-base overflow-hidden ${isCurrent ? 'ring-1 ring-foreground/15' : ''}`}>
              <div className="flex items-center justify-between px-4 py-3 bg-muted/20 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-foreground' : 'bg-muted-foreground/40'}`} />
                  <p className="text-sm font-medium">{phase}</p>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground text-background font-medium">Current</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{items.length} tasks</span>
                  <button
                    onClick={() => setAddingTask(addingTask?.status === 'To do' ? null : { status: 'To do', title: '', phase } as any)}
                    className="flex items-center gap-1 h-6 px-2 rounded text-xs font-medium hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Plus size={14} />
                    Add New Task
                  </button>
                </div>
              </div>
              {items.length === 0 && !addingTask ? (
                <p className="text-xs text-muted-foreground/60 text-center py-4">No tasks in this phase</p>
              ) : (
                <div className="divide-y divide-border/40">
                  {items.map(task => (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group/task">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColors[task.status || (task.completed ? 'Done' : 'To do')]}`}>
                        {task.status || (task.completed ? 'Done' : 'To do')}
                      </span>
                      <p className="text-sm flex-1 min-w-0 truncate">{task.title}</p>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">{task.dueDate}</span>
                      )}
                      <TaskMenu
                        task={task}
                        onEdit={() => setEditingTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                      />
                    </div>
                  ))}
                  {addingTask && (
                    <div className="px-4 py-3">
                      <input
                        ref={newTaskInputRef}
                        value={addingTask.title}
                        onChange={e => setAddingTask({ ...addingTask, title: e.target.value })}
                        onKeyDown={e => { if (e.key === 'Enter') commitNewTask(); if (e.key === 'Escape') setAddingTask(null); }}
                        placeholder="Task title..."
                        className="w-full text-sm outline-none bg-transparent placeholder:text-muted-foreground/60 border border-border rounded-lg px-3 py-2"
                      />
                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={commitNewTask} className="text-xs px-2 py-1 rounded-md bg-foreground text-background font-medium hover:bg-foreground/90 transition-colors">
                          Add
                        </button>
                        <button onClick={() => setAddingTask(null)} className="text-xs px-2 py-1 rounded-md hover:bg-muted transition-colors text-muted-foreground">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {editingTask && (
        <EditTaskPanel
          task={editingTask}
          project={project}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setView('progress')}
            className={`h-8 px-3 text-sm font-medium transition-colors ${view === 'progress' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
          >
            Progress View
          </button>
          <button
            onClick={() => setView('phase')}
            className={`h-8 px-3 text-sm font-medium transition-colors border-l border-border ${view === 'phase' ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
          >
            Phase View
          </button>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 h-8 text-sm border border-border rounded-lg bg-background w-48 placeholder:text-muted-foreground outline-none focus:border-foreground/30 transition-colors"
          />
        </div>

        {/* Filter — icon only, matches projects page styling */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`relative toolbar-icon-btn ${activeFilterCount > 0 ? 'toolbar-icon-btn-active' : ''}`}
          >
            <Filter size={18} />
          </button>
          {showFilter && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowFilter(false)} />
              <div className="absolute right-0 mt-1 w-64 bg-popover border border-border rounded-xl shadow-lg z-30 py-2 overflow-hidden">
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tasks Progress</p>
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(prev => prev === s ? null : s)}
                    className={`filter-item ${statusFilter === s ? 'filter-item-active' : 'filter-item-inactive'}`}
                  >
                    {s}
                    {statusFilter === s && <Check size={13} />}
                  </button>
                ))}
                <div className="border-t border-border/40 my-1" />
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Project Phase</p>
                {PROJECT_PHASES.map(p => (
                  <button
                    key={p}
                    onClick={() => setPhaseFilter(prev => prev === p ? null : p)}
                    className={`filter-item ${phaseFilter === p ? 'filter-item-active' : 'filter-item-inactive'}`}
                  >
                    {p}
                    {phaseFilter === p && <Check size={13} />}
                  </button>
                ))}
                {activeFilterCount > 0 && (
                  <div className="border-t border-border/40 px-3 pt-2 pb-1">
                    <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                      <X size={12} />
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {view === 'progress' && renderKanban()}
      {view === 'phase' && renderPhaseView()}
    </div>
  );
}
