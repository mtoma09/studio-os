'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SidePanel } from '@/components/ui/SidePanel';
import { DatePicker } from '@/components/ui/DatePicker';
import { ProjectStatusBadge } from '@/components/projects/ProjectStatusBadge';
import { ProjectStatus, PROJECT_PHASES } from '@/lib/projects-data';
import { ChevronDown, Plus, Diamond } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface GanttPhase {
  id: string;
  name: string;
  start: string; // ISO date YYYY-MM-DD
  end: string;
  progress: number; // 0–100
  taskCount: number;
  taskComplete: number;
}

export interface GanttMilestone {
  id: string;
  name: string;
  date: string; // ISO date
  assignedUsers: string[];
  status: 'On Track' | 'At Risk' | 'Completed' | 'Delayed';
  phaseId?: string;
}

interface GanttViewProps {
  projectName: string;
  projectStatus: ProjectStatus;
  phases: GanttPhase[];
  milestones?: GanttMilestone[];
  onAddPhase?: (phase: GanttPhase) => void;
  onEditPhase?: (phase: GanttPhase) => void;
  onDeletePhase?: (id: string) => void;
  onAddMilestone?: (m: GanttMilestone) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

type ZoomLevel = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year';
const ZOOM_LEVELS: ZoomLevel[] = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SIDEBAR_W = 300;
const ROW_H = 56;
const GROUP_ROW_H = 28;
const UNIT_ROW_H = 24;
const HEADER_H = GROUP_ROW_H + UNIT_ROW_H;
const BAR_H = 30;
const PROJECT_HEADER_H = 48;

// Phase bar colours — monochromatic ramp
const PHASE_BAR_COLORS = [
  { bar: 'bg-foreground/18', text: 'text-foreground/90', fill: 'bg-foreground/55', dot: 'bg-foreground/60' },
  { bar: 'bg-foreground/14', text: 'text-foreground/80', fill: 'bg-foreground/42', dot: 'bg-foreground/48' },
  { bar: 'bg-foreground/11', text: 'text-foreground/75', fill: 'bg-foreground/32', dot: 'bg-foreground/38' },
  { bar: 'bg-foreground/9', text: 'text-foreground/70', fill: 'bg-foreground/24', dot: 'bg-foreground/30' },
];

const MILESTONE_STATUS_COLORS: Record<GanttMilestone['status'], string> = {
  'On Track': 'text-foreground/70',
  'At Risk': 'text-amber-500',
  'Completed': 'text-foreground',
  'Delayed': 'text-red-500',
};

// ── Date helpers (local-time safe) ───────────────────────────────────────────

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  if (y && m && d) return new Date(y, m - 1, d);
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  r.setDate(r.getDate() - r.getDay());
  return r;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfQuarter(d: Date): Date {
  return new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1);
}

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

function fmtRange(s: string, e: string): string {
  const sd = parseDate(s);
  const ed = parseDate(e);
  return `${sd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${ed.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`;
}

// ── Zoom config ──────────────────────────────────────────────────────────────

interface ZoomConfig {
  unitWidth: number;
  unitLabel: (d: Date) => string;
  unitStep: (d: Date, n: number) => Date;
  groupLabel: (d: Date) => string;
}

const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
  Day: {
    unitWidth: 36,
    unitLabel: (d) => String(d.getDate()),
    unitStep: (d, n) => addDays(d, n),
    groupLabel: (d) => `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
  },
  Week: {
    unitWidth: 64,
    unitLabel: (d) => `${MONTH_LABELS[d.getMonth()].slice(0, 1)} ${d.getDate()}`,
    unitStep: (d, n) => addDays(d, n * 7),
    groupLabel: (d) => `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
  },
  Month: {
    unitWidth: 96,
    unitLabel: (d) => MONTH_LABELS[d.getMonth()],
    unitStep: (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1),
    groupLabel: (d) => String(d.getFullYear()),
  },
  Quarter: {
    unitWidth: 88,
    unitLabel: (d) => `Q${Math.floor(d.getMonth() / 3) + 1}`,
    unitStep: (d, n) => new Date(d.getFullYear(), d.getMonth() + n * 3, 1),
    groupLabel: (d) => String(d.getFullYear()),
  },
  Year: {
    unitWidth: 120,
    unitLabel: (d) => String(d.getFullYear()),
    unitStep: (d, n) => new Date(d.getFullYear() + n, 0, 1),
    groupLabel: () => 'Years',
  },
};

// ── Dropdown Select ──────────────────────────────────────────────────────────

function SelectDropdown({ value, options, onChange, placeholder }: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="notion-button border border-border w-full justify-between text-sm">
        <span className={value ? '' : 'text-muted-foreground'}>{value || placeholder || 'Select...'}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden max-h-60 dropdown-scroll">
            {options.map((opt: string) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors whitespace-nowrap"
              >
                <span className={value === opt ? 'text-foreground font-medium' : 'text-muted-foreground'}>{opt}</span>
                {value === opt && <span className="w-1.5 h-1.5 rounded-full bg-foreground/50" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Date Dropdown ───────────────────────────────────────────────────────────

function DateDropdown({ value, onChange, label }: {
  value: string;
  onChange: (iso: string) => void;
  label: string;
}) {
  const display = value
    ? parseDate(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const handleChange = (formatted: string) => {
    if (!formatted) { onChange(''); return; }
    const d = new Date(formatted);
    if (!isNaN(d.getTime())) onChange(toISO(d));
  };
  return <DatePicker value={display} onChange={handleChange} placeholder={label} />;
}

// ── Phase Overflow Menu ──────────────────────────────────────────────────────

function PhaseMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('scroll', close, true);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!open && btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(!open);
  };

  const btn = (
    <button
      ref={btnRef}
      onClick={toggle}
      className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
    >
      <span className="text-base leading-none tracking-tighter">⋯</span>
    </button>
  );

  if (!open || !rect) return btn;
  const top = rect.bottom + 4;
  const left = Math.min(rect.right - 160, window.innerWidth - 180);

  return createPortal(
    <>
      {btn}
      <div className="fixed z-[61] w-40 bg-popover border border-border rounded-xl shadow-lg py-1 overflow-hidden" style={{ top, left }}>
        <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }} className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground">
          Edit phase
        </button>
        <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }} className="w-full px-3 py-2 text-sm text-left hover:bg-red-50 transition-colors text-red-600">
          Delete phase
        </button>
      </div>
    </>,
    document.body,
  );
}

// ── Add / Edit Phase Panels ──────────────────────────────────────────────────

function AddPhasePanel({ onClose, onSave }: { onClose: () => void; onSave: (p: GanttPhase) => void }) {
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const canSave = name.trim() && start && end && end >= start;

  return (
    <SidePanel
      subtitle="Define a new timeline phase"
      onClose={onClose}
      footer={
        <>
          <div />
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="notion-button border border-border">Cancel</button>
            <button onClick={() => canSave && onSave({ id: `phase-${Date.now()}`, name: name.trim(), start, end, progress: 0, taskCount: 0, taskComplete: 0 })} disabled={!canSave} className="notion-button bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed">
              Add Phase
            </button>
          </div>
        </>
      }
    >
      <div className="px-6 py-5 space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Phase Details</p>
          <label className="block text-xs text-muted-foreground mb-1.5">Phase Name <span className="text-red-400 ml-0.5">*</span></label>
          <SelectDropdown value={name} options={PROJECT_PHASES} onChange={setName} placeholder="Select a phase" />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Timeframe</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Start Date <span className="text-red-400 ml-0.5">*</span></label>
              <DateDropdown value={start} onChange={setStart} label="Start date" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">End Date <span className="text-red-400 ml-0.5">*</span></label>
              <DateDropdown value={end} onChange={setEnd} label="End date" />
            </div>
          </div>
          {start && end && end < start && <p className="text-xs text-red-500 mt-1">End date must be after start date</p>}
          {start && end && end >= start && (
            <div className="p-3 bg-muted/30 rounded-lg mt-3">
              <p className="text-xs text-muted-foreground">Duration: <span className="text-foreground font-medium">{daysBetween(parseDate(start), parseDate(end))} days</span></p>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
}

function EditPhasePanel({ phase, onClose, onSave }: { phase: GanttPhase; onClose: () => void; onSave: (p: GanttPhase) => void }) {
  const [name, setName] = useState(phase.name);
  const [start, setStart] = useState(phase.start);
  const [end, setEnd] = useState(phase.end);
  const canSave = name.trim() && start && end && end >= start;

  return (
    <SidePanel
      subtitle={phase.name}
      onClose={onClose}
      footer={
        <>
          <div />
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="notion-button border border-border">Cancel</button>
            <button onClick={() => canSave && onSave({ ...phase, name: name.trim(), start, end })} disabled={!canSave} className="notion-button bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed">
              Save Changes
            </button>
          </div>
        </>
      }
    >
      <div className="px-6 py-5 space-y-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Phase Details</p>
          <label className="block text-xs text-muted-foreground mb-1.5">Phase Name <span className="text-red-400 ml-0.5">*</span></label>
          <SelectDropdown value={name} options={PROJECT_PHASES} onChange={setName} />
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Timeframe</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Start Date <span className="text-red-400 ml-0.5">*</span></label>
              <DateDropdown value={start} onChange={setStart} label="Start date" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">End Date <span className="text-red-400 ml-0.5">*</span></label>
              <DateDropdown value={end} onChange={setEnd} label="End date" />
            </div>
          </div>
        </div>
      </div>
    </SidePanel>
  );
}

// ── Zoom Selector ────────────────────────────────────────────────────────────

function ZoomSelector({ value, onChange }: { value: ZoomLevel; onChange: (v: ZoomLevel) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="notion-button border border-border text-sm w-28 justify-between">
        <span>{value}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden">
            {ZOOM_LEVELS.map(level => (
              <button
                key={level}
                onClick={() => { onChange(level); setOpen(false); }}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors whitespace-nowrap min-w-[8rem]"
              >
                <span className={value === level ? 'text-foreground font-medium' : 'text-muted-foreground'}>{level}</span>
                {value === level && <span className="w-1.5 h-1.5 rounded-full bg-foreground/50" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Milestone Tooltip ────────────────────────────────────────────────────────

function MilestoneTooltip({ milestone, rect }: { milestone: GanttMilestone; rect: DOMRect }) {
  const top = rect.top - 8;
  const left = Math.min(rect.left, window.innerWidth - 240);

  return createPortal(
    <div
      className="fixed z-[70] w-56 bg-popover border border-border rounded-xl shadow-lg p-3 pointer-events-none"
      style={{ top: top - 120 < 0 ? rect.bottom + 8 : top - 120, left }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Diamond size={12} className="text-foreground/70 flex-shrink-0" />
        <p className="text-sm font-medium truncate">{milestone.name}</p>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Due: <span className="text-foreground">{parseDate(milestone.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
        {milestone.assignedUsers.length > 0 && (
          <p>Assigned: <span className="text-foreground">{milestone.assignedUsers.join(', ')}</span></p>
        )}
        <p>Status: <span className={MILESTONE_STATUS_COLORS[milestone.status]}>{milestone.status}</span></p>
      </div>
    </div>,
    document.body,
  );
}

// ── Main GanttView ───────────────────────────────────────────────────────────

export function GanttView({
  projectName,
  projectStatus,
  phases,
  milestones = [],
  onAddPhase,
  onEditPhase,
  onDeletePhase,
}: GanttViewProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [zoom, setZoom] = useState<ZoomLevel>('Week');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingPhase, setEditingPhase] = useState<GanttPhase | null>(null);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);
  const [hoveredMilestone, setHoveredMilestone] = useState<{ m: GanttMilestone; rect: DOMRect } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = ZOOM_CONFIGS[zoom];

  // Timeline bounds — align to zoom unit start, pad either side
  const { timelineStart, timelineEnd } = useMemo(() => {
    if (phases.length === 0) {
      const s = addDays(today, -30);
      const e = addDays(today, 60);
      return { timelineStart: s, timelineEnd: e };
    }
    let minD = parseDate(phases[0].start);
    let maxD = parseDate(phases[0].end);
    phases.forEach(p => {
      const s = parseDate(p.start);
      const e = parseDate(p.end);
      if (s < minD) minD = s;
      if (e > maxD) maxD = e;
    });
    milestones.forEach(m => {
      const d = parseDate(m.date);
      if (d < minD) minD = d;
      if (d > maxD) maxD = d;
    });

    let alignedStart: Date;
    let alignedEnd: Date;
    if (zoom === 'Day') { alignedStart = addDays(minD, -7); alignedEnd = addDays(maxD, 14); }
    else if (zoom === 'Week') { alignedStart = addDays(startOfWeek(minD), -14); alignedEnd = addDays(startOfWeek(maxD), 28); }
    else if (zoom === 'Month') { alignedStart = addDays(startOfMonth(minD), -31); alignedEnd = addDays(startOfMonth(maxD), 62); }
    else if (zoom === 'Quarter') { alignedStart = startOfQuarter(addDays(minD, -45)); alignedEnd = addDays(startOfQuarter(maxD), 180); }
    else { alignedStart = startOfYear(addDays(minD, -90)); alignedEnd = addDays(startOfYear(maxD), 365); }

    return { timelineStart: alignedStart, timelineEnd: alignedEnd };
  }, [phases, milestones, zoom, today]);

  // Generate unit columns and group spans
  const { units, groups, calendarW } = useMemo(() => {
    const unitArr: { date: Date; label: string; isMonthStart: boolean; isWeekend: boolean }[] = [];
    let cur = new Date(timelineStart);
    let guard = 0;
    while (cur < timelineEnd && guard < 5000) {
      const prev = guard > 0 ? unitArr[guard - 1].date : null;
      unitArr.push({
        date: new Date(cur),
        label: config.unitLabel(cur),
        isMonthStart: !prev || prev.getMonth() !== cur.getMonth(),
        isWeekend: zoom === 'Day' && (cur.getDay() === 0 || cur.getDay() === 6),
      });
      cur = config.unitStep(cur, 1);
      guard++;
    }

    const groupArr: { label: string; width: number; count: number }[] = [];
    let i = 0;
    while (i < unitArr.length) {
      const gLabel = config.groupLabel(unitArr[i].date);
      let w = 0;
      let count = 0;
      while (i + count < unitArr.length && config.groupLabel(unitArr[i + count].date) === gLabel) {
        w += config.unitWidth;
        count++;
      }
      groupArr.push({ label: gLabel, width: w, count });
      i += count;
    }

    return { units: unitArr, groups: groupArr, calendarW: unitArr.length * config.unitWidth };
  }, [timelineStart, timelineEnd, config]);

  const totalDays = daysBetween(timelineStart, timelineEnd);
  const dayWidth = calendarW / Math.max(totalDays, 1);

  // Today position
  const todayOffsetDays = daysBetween(timelineStart, today);
  const todayX = todayOffsetDays * dayWidth;
  const todayVisible = todayOffsetDays >= 0 && todayOffsetDays <= totalDays;

  // Scroll to today
  const scrollToToday = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const targetX = todayX - container.clientWidth / 2 + SIDEBAR_W;
    container.scrollTo({ left: Math.max(0, targetX), behavior: 'smooth' });
  }, [todayX]);

  // Auto-scroll to today on mount
  useEffect(() => {
    const t = setTimeout(scrollToToday, 100);
    return () => clearTimeout(t);
  }, [scrollToToday]);

  const handleMilestoneEnter = (m: GanttMilestone, e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    setHoveredMilestone({ m, rect: target.getBoundingClientRect() });
  };

  const totalRows = phases.length + 1; // +1 for "New Phase" row

  return (
    <>
      {showAddPanel && <AddPhasePanel onClose={() => setShowAddPanel(false)} onSave={(p) => { onAddPhase?.(p); setShowAddPanel(false); }} />}
      {editingPhase && <EditPhasePanel phase={editingPhase} onClose={() => setEditingPhase(null)} onSave={(p) => { onEditPhase?.(p); setEditingPhase(null); }} />}
      {hoveredMilestone && <MilestoneTooltip milestone={hoveredMilestone.m} rect={hoveredMilestone.rect} />}

      <div className="card-base overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
        {/* ── Scrollable area ── */}
        <div
          ref={scrollRef}
          className="overflow-auto modal-scroll flex-1"
        >
          <div style={{ width: SIDEBAR_W + calendarW }} className="relative">

            {/* ── HEADER ROW ── */}
            <div className="flex sticky top-0 z-40 border-b border-border">
              {/* Sidebar header — project name */}
              <div
                className="flex-shrink-0 bg-muted/30 border-r border-border flex flex-col"
                style={{ width: SIDEBAR_W, height: HEADER_H + PROJECT_HEADER_H, position: 'sticky', left: 0, zIndex: 50 }}
              >
                {/* "Projects" label row */}
                <div className="flex items-center px-4 border-b border-border/30" style={{ height: GROUP_ROW_H }}>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Projects</span>
                </div>
                {/* "Phases" sub-label row */}
                <div className="flex items-center px-4 border-b border-border/30" style={{ height: UNIT_ROW_H }}>
                  <span className="text-[10px] text-muted-foreground">Phases</span>
                </div>
                {/* Project header row */}
                <div className="flex items-center gap-2 px-4" style={{ height: PROJECT_HEADER_H }}>
                  <span className="text-base leading-none flex-shrink-0">▼</span>
                  <span className="text-sm font-semibold truncate flex-1">{projectName}</span>
                  <ProjectStatusBadge status={projectStatus} />
                </div>
              </div>

              {/* Calendar header */}
              <div className="flex flex-col" style={{ width: calendarW }}>
                {/* Group row */}
                <div className="flex bg-muted/20 border-b border-border/30" style={{ height: GROUP_ROW_H }}>
                  {groups.map((g, i) => (
                    <div key={i} className="text-xs font-medium text-muted-foreground flex items-center px-2 border-r border-border/25" style={{ width: g.width }}>
                      {g.label}
                    </div>
                  ))}
                </div>
                {/* Unit row */}
                <div className="flex bg-card" style={{ height: UNIT_ROW_H }}>
                  {units.map((u, i) => (
                    <div
                      key={i}
                      className={`text-[10px] text-center flex items-center justify-center border-r border-border/20 ${u.isMonthStart ? 'font-semibold text-foreground/60' : 'text-muted-foreground'} ${u.isWeekend ? 'bg-muted/20' : ''}`}
                      style={{ width: config.unitWidth }}
                    >
                      {u.label}
                    </div>
                  ))}
                </div>
                {/* Project header spacer row (aligns with sidebar project header) */}
                <div className="bg-muted/15 border-b border-border/30" style={{ height: PROJECT_HEADER_H }} />
              </div>
            </div>

            {/* ── BODY ROW ── */}
            <div className="flex">
              {/* Sidebar column — sticky left */}
              <div
                className="flex-shrink-0 bg-card border-r border-border"
                style={{ width: SIDEBAR_W, position: 'sticky', left: 0, zIndex: 30 }}
              >
                {/* "Active" sub-header */}
                <div className="flex items-center px-4 py-1.5 bg-muted/15 border-b border-border/20">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active</span>
                </div>

                {phases.map((phase, i) => {
                  const colors = PHASE_BAR_COLORS[i % PHASE_BAR_COLORS.length];
                  const isSelected = selectedPhaseId === phase.id;
                  return (
                    <div
                      key={phase.id}
                      onClick={() => setSelectedPhaseId(phase.id)}
                      onDoubleClick={() => setEditingPhase(phase)}
                      className={`flex items-center justify-between gap-2 px-4 border-b border-border/20 transition-colors group cursor-pointer ${
                        isSelected ? 'bg-muted/40' : 'hover:bg-muted/20'
                      }`}
                      style={{ height: ROW_H }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{phase.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {phase.taskComplete} of {phase.taskCount} Task{phase.taskCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <PhaseMenu
                          onEdit={() => setEditingPhase(phase)}
                          onDelete={() => onDeletePhase?.(phase.id)}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* New Phase row */}
                <button
                  onClick={() => setShowAddPanel(true)}
                  className="flex items-center gap-2 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors w-full border-b border-border/20"
                  style={{ height: ROW_H }}
                >
                  <Plus size={16} />
                  New Phase
                </button>
              </div>

              {/* Timeline grid column */}
              <div className="relative" style={{ width: calendarW, height: totalRows * ROW_H + 34 }}>
                {/* Alternating background strips + weekend shading */}
                {units.map((u, i) => (
                  <div
                    key={i}
                    className={`absolute top-0 bottom-0 ${i % 2 === 0 ? 'bg-muted/[0.04]' : ''} ${u.isWeekend ? 'bg-muted/[0.08]' : ''} ${u.isMonthStart ? 'border-l border-border/10' : ''}`}
                    style={{ left: i * config.unitWidth, width: config.unitWidth }}
                  />
                ))}

                {/* "Active" spacer row (matches sidebar) */}
                <div className="absolute left-0 right-0 border-b border-border/20 bg-muted/10" style={{ top: 0, height: 34 }} />

                {/* Today indicator */}
                {todayVisible && (
                  <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: todayX }}>
                    <div className="w-px h-full bg-foreground/50" />
                    <div className="absolute -left-0.5 top-0 bottom-0 w-1 bg-foreground/[0.05]" />
                    <div className="absolute -top-px left-0 -translate-x-1/2 text-[9px] font-semibold uppercase tracking-wider text-background bg-foreground/70 rounded px-1.5 py-px whitespace-nowrap">
                      Today
                    </div>
                  </div>
                )}

                {/* Phase bars */}
                {phases.map((phase, i) => {
                  const colors = PHASE_BAR_COLORS[i % PHASE_BAR_COLORS.length];
                  const startOff = daysBetween(timelineStart, parseDate(phase.start));
                  const endOff = daysBetween(timelineStart, parseDate(phase.end));
                  const barLeft = Math.max(0, startOff) * dayWidth;
                  const barWidth = Math.max((Math.min(totalDays, endOff) - Math.max(0, startOff)) * dayWidth, 24);
                  const barTop = 34 + i * ROW_H + (ROW_H - BAR_H) / 2;
                  const isSelected = selectedPhaseId === phase.id;

                  return (
                    <div key={phase.id}>
                      {/* Row background + separator */}
                      <div
                        className={`absolute left-0 right-0 border-b border-border/20 ${isSelected ? 'bg-muted/20' : ''}`}
                        style={{ top: 34 + i * ROW_H, height: ROW_H }}
                      />
                      {/* Bar */}
                      <div
                        className={`absolute rounded-lg overflow-hidden transition-all hover:ring-1 hover:ring-foreground/25 ${isSelected ? 'ring-1 ring-foreground/20' : ''}`}
                        style={{ left: barLeft, width: barWidth, top: barTop, height: BAR_H }}
                        onDoubleClick={() => setEditingPhase(phase)}
                      >
                        <div className={`absolute inset-0 ${colors.bar}`} />
                        <div className={`absolute inset-y-0 left-0 rounded-l-lg ${colors.fill} transition-all duration-500`} style={{ width: `${phase.progress}%` }} />
                        {barWidth > 60 && (
                          <span className={`absolute inset-0 flex items-center px-2.5 text-[11px] font-medium truncate ${colors.text}`}>
                            {phase.name}
                          </span>
                        )}
                        {barWidth > 120 && (
                          <span className="absolute inset-y-0 right-2 flex items-center text-[10px] opacity-60">
                            {parseDate(phase.end).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Milestones */}
                {milestones.map(m => {
                  const mOff = daysBetween(timelineStart, parseDate(m.date));
                  const mX = mOff * dayWidth;
                  if (mX < 0 || mX > calendarW) return null;
                  // Position milestone at the row of its phase, or first row
                  const phaseIdx = m.phaseId ? phases.findIndex(p => p.id === m.phaseId) : 0;
                  const rowIdx = phaseIdx >= 0 ? phaseIdx : 0;
                  const mTop = 34 + rowIdx * ROW_H + ROW_H / 2;
                  return (
                    <div
                      key={m.id}
                      className="absolute z-20 cursor-pointer"
                      style={{ left: mX - 7, top: mTop - 7 }}
                      onMouseEnter={(e) => handleMilestoneEnter(m, e)}
                      onMouseLeave={() => setHoveredMilestone(null)}
                    >
                      <div className="w-3.5 h-3.5 rotate-45 border-2 border-foreground/70 bg-background rounded-sm hover:bg-foreground/20 transition-colors" />
                    </div>
                  );
                })}

                {/* New Phase row spacer */}
                <div className="absolute left-0 right-0 border-b border-border/20" style={{ top: 34 + phases.length * ROW_H, height: ROW_H }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom toolbar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-card flex-shrink-0">
          <button onClick={scrollToToday} className="notion-button border border-border text-sm">
            Today
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">Zoom</span>
            <ZoomSelector value={zoom} onChange={setZoom} />
          </div>
        </div>
      </div>
    </>
  );
}
