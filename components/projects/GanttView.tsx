'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Ellipsis as MoreHorizontal, Pencil, Trash2, CircleCheck as CheckCircle2, ChevronUp, ChevronDown, Check } from 'lucide-react';
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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(s: string): Date { return new Date(s); }
function toISO(d: Date): string { return d.toISOString().slice(0, 10); }
function daysBetween(a: Date, b: Date): number { return Math.round((b.getTime() - a.getTime()) / 86400000); }
function addDays(d: Date, n: number): Date { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

// Subtle phase bar fills
const PHASE_BAR_COLORS = [
  { bar: 'bg-foreground/20', text: 'text-foreground/80', fill: 'bg-foreground/45', dot: 'bg-foreground/60' },
  { bar: 'bg-foreground/16', text: 'text-foreground/80', fill: 'bg-foreground/38', dot: 'bg-foreground/50' },
  { bar: 'bg-foreground/13', text: 'text-foreground/70', fill: 'bg-foreground/30', dot: 'bg-foreground/40' },
  { bar: 'bg-foreground/10', text: 'text-foreground/70', fill: 'bg-foreground/25', dot: 'bg-foreground/35' },
];

const STICKY_W = 288;
const DAY_W = 14;
const WEEK_W = DAY_W * 7;
const ROW_H = 56;

// ── Phase Menu (3-dot, always visible) ──────────────────────────────────────
interface PhaseMenuProps {
  phase: GanttPhase;
  isFirst: boolean;
  isLast: boolean;
  canReorder: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}
function PhaseMenu({ phase, isFirst, isLast, canReorder, onEdit, onDelete, onMoveUp, onMoveDown }: PhaseMenuProps) {
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
        className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <MoreHorizontal size={15} />
      </button>
    );
  }
  const top = rect.bottom + 4;
  const left = Math.min(rect.right - 160, window.innerWidth - 180);
  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-6 h-6 rounded flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
      >
        <MoreHorizontal size={15} />
      </button>
      {createPortal(
        <>
          <div className="fixed inset-0 z-[60]" style={{ overflow: 'hidden' }} onClick={close} />
          <div
            className="fixed z-[61] w-40 bg-popover border border-border rounded-xl shadow-lg py-1 overflow-hidden"
            style={{ top, left }}
          >
            <button onClick={() => { close(); onEdit(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground">
              <Pencil size={14} className="text-muted-foreground" /> Edit phase
            </button>
            {canReorder && (
              <>
                <button onClick={() => { close(); onMoveUp(); }} disabled={isFirst} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronUp size={14} className="text-muted-foreground" /> Move up
                </button>
                <button onClick={() => { close(); onMoveDown(); }} disabled={isLast} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-foreground disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronDown size={14} className="text-muted-foreground" /> Move down
                </button>
              </>
            )}
            <button onClick={() => { close(); onDelete(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-red-50 transition-colors text-red-600">
              <Trash2 size={14} /> Delete phase
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}

// ── StudioOS-styled Dropdown Select ──────────────────────────────────────────
interface SelectDropdownProps {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
}
function SelectDropdown({ value, options, onChange, placeholder }: SelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="notion-button border border-border w-full justify-between text-sm"
      >
        <span className={value ? '' : 'text-muted-foreground'}>{value || placeholder || 'Select...'}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 overflow-hidden max-h-60 overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className="flex items-center justify-between w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors whitespace-nowrap"
              >
                <span className={value === opt ? 'text-foreground font-medium' : 'text-muted-foreground'}>{opt}</span>
                {value === opt && <Check size={14} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── StudioOS-styled Date Picker Button ───────────────────────────────────────
interface DateDropdownProps {
  value: string;
  onChange: (iso: string) => void;
  label: string;
}
function DateDropdown({ value, onChange, label }: DateDropdownProps) {
  const displayValue = value
    ? parseDate(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '';
  const handleChange = (formatted: string) => {
    if (!formatted) { onChange(''); return; }
    const d = new Date(formatted);
    if (!isNaN(d.getTime())) {
      onChange(toISO(d));
    }
  };
  return (
    <DatePicker value={displayValue} onChange={handleChange} placeholder={label} />
  );
}

// ── Add Phase Panel ──────────────────────────────────────────────────────────
interface AddPhasePanelProps {
  onClose: () => void;
  onSave: (phase: GanttPhase) => void;
}
function AddPhasePanel({ onClose, onSave }: AddPhasePanelProps) {
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const canSave = name.trim() && start && end && end >= start;

  const handleSave = () => {
    if (!canSave) return;
    onSave({ id: `phase-${Date.now()}`, name: name.trim(), start, end, progress: 10 });
  };

  return (
    <SidePanel
      subtitle="Define a new timeline phase"
      onClose={onClose}
      width="min(40vw, 520px)"
      footer={
        <>
          <div />
          <div className="flex gap-2">
            <button onClick={onClose} className="notion-button border border-border">Cancel</button>
            <button onClick={handleSave} disabled={!canSave} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Add Phase
            </button>
          </div>
        </>
      }
    >
      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Phase Name *</label>
          <SelectDropdown
            value={name}
            options={PROJECT_PHASES}
            onChange={setName}
            placeholder="Select a phase"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Timeframe *</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[10px] text-muted-foreground mb-1">Start date</label>
              <DateDropdown value={start} onChange={setStart} label="Start date" />
            </div>
            <div className="flex-shrink-0 mt-4 text-muted-foreground text-sm">→</div>
            <div className="flex-1">
              <label className="block text-[10px] text-muted-foreground mb-1">End date</label>
              <DateDropdown value={end} onChange={setEnd} label="End date" />
            </div>
          </div>
          {start && end && end < start && (
            <p className="text-xs text-red-500 mt-1">End date must be after start date</p>
          )}
        </div>
        {start && end && end >= start && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Duration: <span className="text-foreground font-medium">{daysBetween(parseDate(start), parseDate(end))} days</span>
            </p>
          </div>
        )}
      </div>
    </SidePanel>
  );
}

// ── Edit Phase Panel ─────────────────────────────────────────────────────────
interface EditPhasePanelProps {
  phase: GanttPhase;
  onClose: () => void;
  onSave: (phase: GanttPhase) => void;
}
function EditPhasePanel({ phase, onClose, onSave }: EditPhasePanelProps) {
  const [name, setName] = useState(phase.name);
  const [start, setStart] = useState(phase.start);
  const [end, setEnd] = useState(phase.end);

  const canSave = name.trim() && start && end && end >= start;

  return (
    <SidePanel
      subtitle={phase.name}
      onClose={onClose}
      width="min(40vw, 520px)"
      footer={
        <>
          <div />
          <div className="flex gap-2">
            <button onClick={onClose} className="notion-button border border-border">Cancel</button>
            <button onClick={() => canSave && onSave({ ...phase, name: name.trim(), start, end })} disabled={!canSave} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
              Save Changes
            </button>
          </div>
        </>
      }
    >
      <div className="px-6 py-5 space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Phase Name *</label>
          <SelectDropdown value={name} options={PROJECT_PHASES} onChange={setName} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1.5">Timeframe *</label>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-[10px] text-muted-foreground mb-1">Start date</label>
              <DateDropdown value={start} onChange={setStart} label="Start date" />
            </div>
            <div className="flex-shrink-0 mt-4 text-muted-foreground text-sm">→</div>
            <div className="flex-1">
              <label className="block text-[10px] text-muted-foreground mb-1">End date</label>
              <DateDropdown value={end} onChange={setEnd} label="End date" />
            </div>
          </div>
        </div>
      </div>
    </SidePanel>
  );
}

// ── Main GanttView ───────────────────────────────────────────────────────────
export function GanttView({ projectName, currentPhaseName, customPhases, onAddPhase, onEditPhase, onDeletePhase, onReorderPhases }: GanttViewProps) {
  const today = new Date();
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingPhase, setEditingPhase] = useState<GanttPhase | null>(null);

  // Only show current phase + custom phases
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

  const { timelineStart, totalDays, weeks } = useMemo(() => {
    if (allPhases.length === 0) {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return { timelineStart: start, totalDays: 84, weeks: 12 };
    }
    let minDate = parseDate(allPhases[0].start);
    let maxDate = parseDate(allPhases[0].end);
    allPhases.forEach(p => {
      const s = parseDate(p.start);
      const e = parseDate(p.end);
      if (s < minDate) minDate = s;
      if (e > maxDate) maxDate = e;
    });
    minDate = addDays(minDate, -7);
    maxDate = addDays(maxDate, 14);
    const total = Math.max(daysBetween(minDate, maxDate), 28);
    return { timelineStart: minDate, totalDays: total, weeks: Math.ceil(total / 7) };
  }, [allPhases]);

  const calendarW = weeks * WEEK_W;
  const todayOffset = Math.max(0, daysBetween(timelineStart, today));
  const todayX = (todayOffset / totalDays) * calendarW;

  const weekHeaders = useMemo(() => {
    const arr: { label: string; monthBoundary: boolean }[] = [];
    for (let w = 0; w < weeks; w++) {
      const weekStart = addDays(timelineStart, w * 7);
      const prevWeekStart = w > 0 ? addDays(timelineStart, (w - 1) * 7) : null;
      arr.push({
        label: String(weekStart.getDate()),
        monthBoundary: prevWeekStart ? weekStart.getMonth() !== prevWeekStart.getMonth() : false,
      });
    }
    return arr;
  }, [timelineStart, weeks]);

  const monthSpans = useMemo(() => {
    const spans: { label: string; weeks: number }[] = [];
    let w = 0;
    while (w < weeks) {
      const weekStart = addDays(timelineStart, w * 7);
      const m = weekStart.getMonth();
      const yr = weekStart.getFullYear();
      let count = 0;
      while (w + count < weeks && addDays(timelineStart, (w + count) * 7).getMonth() === m) count++;
      spans.push({ label: `${MONTH_LABELS[m]} ${yr}`, weeks: count });
      w += count;
    }
    return spans;
  }, [timelineStart, weeks]);

  const movePhase = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 1 || newIdx >= allPhases.length) return; // can't move current phase
    // Only reorder custom phases (index >= 1)
    const custom = [...customPhases];
    const customFromIdx = idx - 1;
    const customToIdx = newIdx - 1;
    const [moved] = custom.splice(customFromIdx, 1);
    custom.splice(customToIdx, 0, moved);
    onReorderPhases?.(custom);
  };

  return (
    <>
      {showAddPanel && (
        <AddPhasePanel
          onClose={() => setShowAddPanel(false)}
          onSave={(p) => { onAddPhase?.(p); setShowAddPanel(false); }}
        />
      )}
      {editingPhase && (
        <EditPhasePanel
          phase={editingPhase}
          onClose={() => setEditingPhase(null)}
          onSave={(p) => { onEditPhase?.(p); setEditingPhase(null); }}
        />
      )}

      <div className="card-base">
        <div className="overflow-x-auto">
          <div style={{ minWidth: STICKY_W + calendarW }} className="relative">

            {/* Today line — within phase rows only */}
            {todayOffset >= 0 && todayOffset <= totalDays && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: STICKY_W + todayX }}
              >
                <div className="w-px h-full bg-foreground/40" />
              </div>
            )}

            {/* ── Sticky header rows (project + months + weeks) ── */}
            {/* Row 0: Project header — sticky column + sticky top */}
            <div className="flex border-b border-border bg-muted/20 sticky top-0 z-30">
              <div className="flex-shrink-0 bg-muted/30 border-r border-border px-4 py-2.5 sticky left-0 z-40" style={{ width: STICKY_W }}>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Project</span>
              </div>
              <div className="px-4 py-2.5 flex-1 bg-muted/20">
                <p className="text-sm font-medium">{projectName}</p>
              </div>
            </div>

            {/* Row 1: Month headers — sticky column + sticky top-1 */}
            <div className="flex border-b border-border sticky top-[41px] z-30">
              <div className="flex-shrink-0 border-r border-border bg-muted/10 px-4 py-2 sticky left-0 z-40" style={{ width: STICKY_W }}>
                <span className="text-xs text-muted-foreground">Phases</span>
              </div>
              <div className="flex bg-muted/10" style={{ width: calendarW }}>
                {monthSpans.map((m, i) => (
                  <div
                    key={i}
                    className="text-xs font-medium text-muted-foreground py-2 px-2 border-r border-border/30"
                    style={{ width: m.weeks * WEEK_W }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2: Week date headers — sticky column + sticky top-2 */}
            <div className="flex border-b border-border/50 sticky top-[73px] z-30">
              <div className="flex-shrink-0 border-r border-border bg-card sticky left-0 z-40" style={{ width: STICKY_W }} />
              <div className="flex bg-card" style={{ width: calendarW }}>
                {weekHeaders.map((w, i) => (
                  <div
                    key={i}
                    className={`text-[10px] text-center py-1.5 border-r border-border/20 ${w.monthBoundary ? 'border-l border-border/50 font-semibold text-foreground/60' : 'text-muted-foreground'}`}
                    style={{ width: WEEK_W }}
                  >
                    {w.label}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Phase rows ── */}
            <div className="relative">
  

              {/* Alternating week background strips */}
              {weekHeaders.map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-0 bottom-0 ${i % 2 === 0 ? 'bg-muted/8' : ''}`}
                  style={{ left: STICKY_W + i * WEEK_W, width: WEEK_W }}
                />
              ))}

              {/* Phase rows */}
              {allPhases.map((phase, i) => {
                const colors = PHASE_BAR_COLORS[i % PHASE_BAR_COLORS.length];
                const startOff = daysBetween(timelineStart, parseDate(phase.start));
                const endOff = daysBetween(timelineStart, parseDate(phase.end));
                const barLeft = Math.max(0, startOff) * DAY_W;
                const barWidth = Math.max((Math.min(totalDays, endOff) - Math.max(0, startOff)) * DAY_W, 24);
                const isCurrent = phase.id === 'current-phase';

                return (
                  <div
                    key={phase.id}
                    className="flex border-b border-border/30"
                    style={{ height: ROW_H }}
                  >
                    {/* Sticky label column */}
                    <div
                      className="flex-shrink-0 border-r border-border/40 bg-card px-4 flex items-center justify-between gap-2 sticky left-0 z-30"
                      style={{ width: STICKY_W }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{phase.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {parseDate(phase.start).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {parseDate(phase.end).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-foreground text-background font-medium flex-shrink-0">Current</span>
                        )}
                      </div>
                      <PhaseMenu
                        phase={phase}
                        isFirst={i === 1}
                        isLast={i === allPhases.length - 1}
                        canReorder={!isCurrent}
                        onEdit={() => setEditingPhase(phase)}
                        onDelete={() => { if (!isCurrent) onDeletePhase?.(phase.id); }}
                        onMoveUp={() => movePhase(i, -1)}
                        onMoveDown={() => movePhase(i, 1)}
                      />
                    </div>

                    {/* Bar area */}
                    <div className="relative flex-1" style={{ width: calendarW }}>
                      <div
                        className={`absolute top-1/2 -translate-y-1/2 rounded-lg ${colors.bar} overflow-hidden transition-all`}
                        style={{ left: barLeft, width: barWidth, height: 26 }}
                      >
                        <div className={`absolute inset-y-0 left-0 rounded-l-lg ${colors.fill}`} style={{ width: `${phase.progress}%` }} />
                        <span className={`absolute inset-0 flex items-center px-2 text-[11px] font-medium truncate ${colors.text}`}>
                          {phase.name}
                        </span>
                      </div>
                      {phase.progress === 100 && (
                        <div className="absolute top-1/2 -translate-y-1/2 z-10" style={{ left: barLeft + barWidth + 4 }}>
                          <CheckCircle2 size={14} className="text-foreground/50" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add phase row */}
              <button
                onClick={() => setShowAddPanel(true)}
                className="flex items-center gap-2 px-4 py-3 w-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                style={{ minWidth: STICKY_W }}
              >
                <Plus size={15} />
                Add phase
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
