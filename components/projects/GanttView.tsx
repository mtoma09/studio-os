'use client';

import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { SidePanel } from '@/components/ui/SidePanel';
import { DatePicker } from '@/components/ui/DatePicker';
import { PROJECT_PHASES } from '@/lib/projects-data';

export interface GanttPhase {
  id: string;
  name: string;
  start: string; // ISO date YYYY-MM-DD
  end: string;
  progress: number; // 0–100
}

interface GanttViewProps {
  projectName: string;
  currentPhaseName: string;
  customPhases: GanttPhase[];
  onAddPhase?: (phase: GanttPhase) => void;
  onEditPhase?: (phase: GanttPhase) => void;
  onDeletePhase?: (id: string) => void;
  onReorderPhases?: (phases: GanttPhase[]) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

type ZoomLevel = 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year';
const ZOOM_LEVELS: ZoomLevel[] = ['Day', 'Week', 'Month', 'Quarter', 'Year'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SIDEBAR_W = 300;
const ROW_H = 52;
const GROUP_ROW_H = 24;
const UNIT_ROW_H = 22;
const HEADER_H = GROUP_ROW_H + UNIT_ROW_H;

// Phase bar colours — monochromatic
const PHASE_BAR_COLORS = [
  { bar: 'bg-foreground/18', text: 'text-foreground/85', fill: 'bg-foreground/45', dot: 'bg-foreground/55' },
  { bar: 'bg-foreground/14', text: 'text-foreground/75', fill: 'bg-foreground/36', dot: 'bg-foreground/46' },
  { bar: 'bg-foreground/11', text: 'text-foreground/70', fill: 'bg-foreground/28', dot: 'bg-foreground/38' },
  { bar: 'bg-foreground/9', text: 'text-foreground/65', fill: 'bg-foreground/22', dot: 'bg-foreground/32' },
];

// ── Date helpers (local-time safe) ───────────────────────────────────────────

function parseDate(s: string): Date {
  // Parse as local date, not UTC — avoids off-by-one from timezone shift
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

// ── Zoom config ──────────────────────────────────────────────────────────────

interface ZoomConfig {
  unitWidth: number;
  unitLabel: (d: Date) => string;
  unitStep: (d: Date, n: number) => Date;
  groupLabel: (d: Date) => string;
}

const ZOOM_CONFIGS: Record<ZoomLevel, ZoomConfig> = {
  Day: {
    unitWidth: 32,
    unitLabel: (d) => String(d.getDate()),
    unitStep: (d, n) => addDays(d, n),
    groupLabel: (d) => `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
  },
  Week: {
    unitWidth: 60,
    unitLabel: (d) => `${MONTH_LABELS[d.getMonth()].slice(0, 1)} ${d.getDate()}`,
    unitStep: (d, n) => addDays(d, n * 7),
    groupLabel: (d) => `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
  },
  Month: {
    unitWidth: 88,
    unitLabel: (d) => MONTH_LABELS[d.getMonth()],
    unitStep: (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1),
    groupLabel: (d) => String(d.getFullYear()),
  },
  Quarter: {
    unitWidth: 80,
    unitLabel: (d) => `Q${Math.floor(d.getMonth() / 3) + 1}`,
    unitStep: (d, n) => new Date(d.getFullYear(), d.getMonth() + n * 3, 1),
    groupLabel: (d) => String(d.getFullYear()),
  },
  Year: {
    unitWidth: 110,
    unitLabel: (d) => String(d.getFullYear()),
    unitStep: (d, n) => new Date(d.getFullYear() + n, 0, 1),
    groupLabel: () => 'Years',
  },
};

// ── Dropdown Select (no icons) ───────────────────────────────────────────────

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
        <span className="text-muted-foreground text-xs">▾</span>
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
                {value === opt && <span className="text-foreground/50 text-xs">●</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Date Dropdown ────────────────────────────────────────────────────────────

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

// ── Phase Overflow Menu (no icons) ───────────────────────────────────────────

function PhaseMenu({ canReorder, onEdit, onDelete, onMoveUp, onMoveDown }: {
  canReorder: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
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
        {canReorder && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onMoveUp(); }} className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground">
              Move up
            </button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onMoveDown(); }} className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground">
              Move down
            </button>
          </>
        )}
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
            <button onClick={() => canSave && onSave({ id: `phase-${Date.now()}`, name: name.trim(), start, end, progress: 0 })} disabled={!canSave} className="notion-button bg-foreground text-background hover:bg-foreground/90 disabled:opacity-40 disabled:cursor-not-allowed">
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

// ── Zoom Selector (no icons) ─────────────────────────────────────────────────

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
        <span className="text-muted-foreground text-xs">▾</span>
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
                {value === level && <span className="text-foreground/50 text-xs">●</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main GanttView ───────────────────────────────────────────────────────────

export function GanttView({ projectName, currentPhaseName, customPhases, onAddPhase, onEditPhase, onDeletePhase, onReorderPhases }: GanttViewProps) {
  const today = new Date();
  const [zoom, setZoom] = useState<ZoomLevel>('Week');
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingPhase, setEditingPhase] = useState<GanttPhase | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // All phases = current phase (auto-generated) + custom phases
  const allPhases = useMemo(() => {
    const current: GanttPhase = {
      id: 'current-phase',
      name: currentPhaseName,
      start: toISO(addDays(today, -14)),
      end: toISO(addDays(today, 21)),
      progress: 50,
    };
    return [current, ...customPhases];
  }, [currentPhaseName, customPhases]);

  // Timeline bounds — align to zoom unit start, pad either side
  const { timelineStart, timelineEnd } = useMemo(() => {
    let minD = parseDate(allPhases[0].start);
    let maxD = parseDate(allPhases[0].end);
    allPhases.forEach(p => {
      const s = parseDate(p.start);
      const e = parseDate(p.end);
      if (s < minD) minD = s;
      if (e > maxD) maxD = e;
    });

    let alignedStart: Date;
    let alignedEnd: Date;
    const cfg = ZOOM_CONFIGS[zoom];

    if (zoom === 'Day') { alignedStart = addDays(minD, -5); alignedEnd = addDays(maxD, 7); }
    else if (zoom === 'Week') { alignedStart = addDays(startOfWeek(minD), -7); alignedEnd = addDays(startOfWeek(maxD), 21); }
    else if (zoom === 'Month') { alignedStart = addDays(startOfMonth(minD), -16); alignedEnd = addDays(startOfMonth(maxD), 35); }
    else if (zoom === 'Quarter') { alignedStart = startOfQuarter(addDays(minD, -30)); alignedEnd = addDays(startOfQuarter(maxD), 120); }
    else { alignedStart = startOfYear(addDays(minD, -60)); alignedEnd = addDays(startOfYear(maxD), 250); }

    void cfg;
    return { timelineStart: alignedStart, timelineEnd: alignedEnd };
  }, [allPhases, zoom]);

  const config = ZOOM_CONFIGS[zoom];

  // Generate unit columns and group spans
  const { units, groups, calendarW } = useMemo(() => {
    const unitArr: { date: Date; label: string; isMonthStart: boolean }[] = [];
    let cur = timelineStart;
    let guard = 0;
    while (cur < timelineEnd && guard < 5000) {
      const prev = guard > 0 ? unitArr[guard - 1].date : null;
      unitArr.push({
        date: cur,
        label: config.unitLabel(cur),
        isMonthStart: !prev || prev.getMonth() !== cur.getMonth(),
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

  // Today X position (in pixels from timeline start)
  const todayOffsetDays = daysBetween(timelineStart, today);
  const totalDays = daysBetween(timelineStart, timelineEnd);
  const dayWidth = calendarW / Math.max(totalDays, 1);
  const todayX = todayOffsetDays * dayWidth;
  const todayVisible = todayOffsetDays >= 0 && todayOffsetDays <= totalDays;

  // Scroll to today
  const scrollToToday = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !todayVisible) return;
    const targetX = todayX - container.clientWidth / 2 + SIDEBAR_W;
    container.scrollTo({ left: Math.max(0, targetX), behavior: 'smooth' });
  }, [todayX, todayVisible]);

  const movePhase = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 1 || newIdx >= allPhases.length) return;
    const custom = [...customPhases];
    const [moved] = custom.splice(idx - 1, 1);
    custom.splice(newIdx - 1, 0, moved);
    onReorderPhases?.(custom);
  };

  return (
    <>
      {showAddPanel && <AddPhasePanel onClose={() => setShowAddPanel(false)} onSave={(p) => { onAddPhase?.(p); setShowAddPanel(false); }} />}
      {editingPhase && <EditPhasePanel phase={editingPhase} onClose={() => setEditingPhase(null)} onSave={(p) => { onEditPhase?.(p); setEditingPhase(null); }} />}

      <div className="card-base overflow-hidden">
        {allPhases.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-foreground">No project phases yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first project phase to begin planning your project timeline.</p>
            <button onClick={() => setShowAddPanel(true)} className="mt-3 notion-button bg-foreground text-background hover:bg-foreground/90 text-xs">
              New Phase
            </button>
          </div>
        )}

        {allPhases.length > 0 && (
          <div
            ref={scrollRef}
            className="overflow-auto modal-scroll"
            style={{ maxHeight: '72vh' }}
          >
            {/* Inner content sized to sidebar + calendar width */}
            <div style={{ width: SIDEBAR_W + calendarW }} className="relative">

              {/* ── HEADER: flex row with two children (sidebar | calendar) ── */}
              {/* Sidebar header cell sits ABOVE the sidebar column in the same flex row as the calendar header.
                  Because they are siblings in a flex row (not overlapping divs), the sidebar never gets covered. */}
              <div className="flex sticky top-0 z-30 border-b border-border">
                {/* Sidebar header cell */}
                <div
                  className="flex-shrink-0 bg-muted/25 border-r border-b border-border flex flex-col"
                  style={{ width: SIDEBAR_W, height: HEADER_H, position: 'sticky', left: 0, zIndex: 40 }}
                >
                  <div className="flex items-center px-4" style={{ height: GROUP_ROW_H }}>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Projects</span>
                  </div>
                  <div className="flex items-center px-4 border-t border-border/30" style={{ height: UNIT_ROW_H }}>
                    <span className="text-[10px] text-muted-foreground">Phases</span>
                  </div>
                </div>

                {/* Calendar header cell */}
                <div className="flex flex-col" style={{ width: calendarW }}>
                  {/* Group row (months / years) */}
                  <div className="flex bg-muted/20 border-b border-border/30" style={{ height: GROUP_ROW_H }}>
                    {groups.map((g, i) => (
                      <div key={i} className="text-xs font-medium text-muted-foreground flex items-center px-2 border-r border-border/25" style={{ width: g.width }}>
                        {g.label}
                      </div>
                    ))}
                  </div>
                  {/* Unit row (days / weeks / months) */}
                  <div className="flex bg-card" style={{ height: UNIT_ROW_H }}>
                    {units.map((u, i) => (
                      <div
                        key={i}
                        className={`text-[10px] text-center flex items-center justify-center border-r border-border/20 ${u.isMonthStart ? 'font-semibold text-foreground/60' : 'text-muted-foreground'}`}
                        style={{ width: config.unitWidth }}
                      >
                        {u.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── BODY: flex row with two children (sidebar | timeline grid) ── */}
              <div className="flex">
                {/* Sidebar column — sticky left, always above grid content */}
                <div
                  className="flex-shrink-0 bg-card border-r border-border"
                  style={{ width: SIDEBAR_W, position: 'sticky', left: 0, zIndex: 20 }}
                >
                  {allPhases.map((phase, i) => {
                    const colors = PHASE_BAR_COLORS[i % PHASE_BAR_COLORS.length];
                    const isCurrent = phase.id === 'current-phase';
                    return (
                      <div
                        key={phase.id}
                        className="flex items-center justify-between gap-2 px-4 border-b border-border/30 hover:bg-muted/20 transition-colors group"
                        style={{ height: ROW_H }}
                        onDoubleClick={() => setEditingPhase(phase)}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{phase.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {parseDate(phase.start).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {parseDate(phase.end).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          {isCurrent && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground text-background font-medium flex-shrink-0">Current</span>}
                        </div>
                        <div className={`flex-shrink-0 ${isCurrent ? 'opacity-30' : 'opacity-0 group-hover:opacity-100'}`}>
                          <PhaseMenu
                            canReorder={!isCurrent}
                            onEdit={() => setEditingPhase(phase)}
                            onDelete={() => { if (!isCurrent) onDeletePhase?.(phase.id); }}
                            onMoveUp={() => movePhase(i, -1)}
                            onMoveDown={() => movePhase(i, 1)}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Add phase row */}
                  <button
                    onClick={() => setShowAddPanel(true)}
                    className="flex items-center gap-2 px-4 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors w-full"
                    style={{ height: ROW_H }}
                  >
                    <span className="text-base leading-none">+</span>
                    New Phase
                  </button>
                </div>

                {/* Timeline grid column */}
                <div className="relative" style={{ width: calendarW }}>
                  {/* Alternating background strips */}
                  {units.map((u, i) => (
                    <div
                      key={i}
                      className={`absolute top-0 bottom-0 ${i % 2 === 0 ? 'bg-muted/[0.06]' : ''} ${u.isMonthStart ? 'border-l border-border/15' : ''}`}
                      style={{ left: i * config.unitWidth, width: config.unitWidth }}
                    />
                  ))}

                  {/* Today indicator */}
                  {todayVisible && (
                    <div className="absolute top-0 bottom-0 z-10 pointer-events-none" style={{ left: todayX }}>
                      <div className="w-px h-full bg-foreground/45" />
                      <div className="absolute -left-[3px] top-0 bottom-0 w-[7px] bg-foreground/[0.04]" />
                      <div className="absolute -top-0.5 -left-3 text-[9px] font-semibold uppercase tracking-wider text-background bg-foreground/70 rounded px-1 py-px">
                        Today
                      </div>
                    </div>
                  )}

                  {/* Phase bars */}
                  {allPhases.map((phase, i) => {
                    const colors = PHASE_BAR_COLORS[i % PHASE_BAR_COLORS.length];
                    const startOff = daysBetween(timelineStart, parseDate(phase.start));
                    const endOff = daysBetween(timelineStart, parseDate(phase.end));
                    const barLeft = Math.max(0, startOff) * dayWidth;
                    const barWidth = Math.max((Math.min(totalDays, endOff) - Math.max(0, startOff)) * dayWidth, 24);
                    const barTop = i * ROW_H + (ROW_H - 28) / 2;

                    return (
                      <div key={phase.id}>
                        {/* Row background */}
                        <div className="absolute left-0 right-0 border-b border-border/20" style={{ top: i * ROW_H, height: ROW_H }} />
                        {/* Bar */}
                        <div
                          className="absolute rounded-lg overflow-hidden transition-all hover:ring-1 hover:ring-foreground/20"
                          style={{ left: barLeft, width: barWidth, top: barTop, height: 28 }}
                          onDoubleClick={() => setEditingPhase(phase)}
                        >
                          <div className={`absolute inset-0 ${colors.bar}`} />
                          <div className={`absolute inset-y-0 left-0 rounded-l-lg ${colors.fill} transition-all duration-300`} style={{ width: `${phase.progress}%` }} />
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

                  {/* Add phase row spacer */}
                  <div className="border-b border-border/20" style={{ height: ROW_H }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom toolbar ── */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-card">
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
