'use client';

import { useMemo } from 'react';
import { GanttView, GanttPhase, GanttMilestone } from '@/components/projects/GanttView';
import { Project, PROJECT_PHASES } from '@/lib/projects-data';

interface TimelineTabProps {
  project: Project;
  customPhases: GanttPhase[];
  customMilestones: GanttMilestone[];
  onAddPhase: (p: GanttPhase) => void;
  onEditPhase: (p: GanttPhase) => void;
  onDeletePhase: (id: string) => void;
  onAddMilestone: (m: GanttMilestone) => void;
}

// Parse "Jan 2024" or "Dec 18, 2024" style date strings
function parseProjectDate(s: string): Date {
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // Try "Month Year" format
  const parts = s.match(/(\w+)\s+(\d{4})/);
  if (parts) {
    const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
    const m = months[parts[1]];
    if (m !== undefined) return new Date(Number(parts[2]), m, 1);
  }
  return new Date();
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function TimelineTab({ project, customPhases, customMilestones, onAddPhase, onEditPhase, onDeletePhase, onAddMilestone }: TimelineTabProps) {
  // Generate phases from project tasks
  const generatedPhases = useMemo<GanttPhase[]>(() => {
    const phases: GanttPhase[] = [];
    const currentPhaseIdx = PROJECT_PHASES.indexOf(project.currentPhase);

    PROJECT_PHASES.forEach((phaseName, idx) => {
      const phaseTasks = project.tasks.filter(t => t.phase === phaseName);
      const taskCount = phaseTasks.length;
      const taskComplete = phaseTasks.filter(t => t.completed).length;

      // Only include phases up to current or with tasks
      if (idx <= currentPhaseIdx || taskCount > 0) {
        // Estimate dates: distribute across project timeline
        const projectStart = parseProjectDate(project.startDate);
        const projectEnd = parseProjectDate(project.targetCompletion);
        const totalDays = Math.max(30, (projectEnd.getTime() - projectStart.getTime()) / 86400000);
        const phaseDuration = totalDays / PROJECT_PHASES.length;

        const phaseStart = addDays(projectStart, idx * phaseDuration);
        const phaseEnd = addDays(phaseStart, phaseDuration);

        // If this is the current phase, use today as a reference
        let progress = 0;
        if (idx < currentPhaseIdx) progress = 100;
        else if (idx === currentPhaseIdx) {
          progress = taskCount > 0 ? Math.round((taskComplete / taskCount) * 100) : project.phaseProgress;
        }

        phases.push({
          id: `gen-${phaseName}`,
          name: phaseName,
          start: toISO(phaseStart),
          end: toISO(phaseEnd),
          progress,
          taskCount,
          taskComplete,
        });
      }
    });

    return phases;
  }, [project]);

  // Combine generated + custom phases
  const allPhases = useMemo(() => {
    const map = new Map<string, GanttPhase>();
    generatedPhases.forEach(p => map.set(p.id, p));
    customPhases.forEach(p => map.set(p.id, p));
    return Array.from(map.values());
  }, [generatedPhases, customPhases]);

  // Generate milestones from project timeline events
  const generatedMilestones = useMemo<GanttMilestone[]>(() => {
    return project.timeline
      .filter(e => e.type === 'meeting' || e.type === 'status')
      .slice(0, 4)
      .map((e, i) => ({
        id: `gen-m-${i}`,
        name: e.title,
        date: toISO(parseProjectDate(e.date)),
        assignedUsers: [project.team.leadDesigner || project.projectManager].filter(Boolean) as string[],
        status: 'Completed' as const,
        phaseId: undefined,
      }));
  }, [project]);

  const allMilestones = useMemo(() => {
    const map = new Map<string, GanttMilestone>();
    generatedMilestones.forEach(m => map.set(m.id, m));
    customMilestones.forEach(m => map.set(m.id, m));
    return Array.from(map.values());
  }, [generatedMilestones, customMilestones]);

  return (
    <GanttView
      projectName={project.name}
      projectStatus={project.status}
      phases={allPhases}
      milestones={allMilestones}
      onAddPhase={onAddPhase}
      onEditPhase={onEditPhase}
      onDeletePhase={onDeletePhase}
      onAddMilestone={onAddMilestone}
    />
  );
}
