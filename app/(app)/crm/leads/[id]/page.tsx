'use client';

import Link from 'next/link';
import { mockLeads, formatBudget } from '@/lib/crm-data';
import { LeadStatusBadge } from '@/components/crm/StatusBadge';
import { Timeline } from '@/components/crm/Timeline';
import { NotesPanel } from '@/components/crm/NotesPanel';
import { TaskList } from '@/components/crm/TaskList';
import { DetailSection, DetailField } from '@/components/crm/DetailSection';

interface Props {
  params: { id: string };
}

export default function LeadDetailPage({ params }: Props) {
  const { id } = params;
  const lead = mockLeads.find((l) => l.id === id);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="material-icons-outlined text-muted-foreground mb-3" style={{ fontSize: 48 }}>person_search</span>
        <h2 className="font-medium text-lg mb-1">Lead not found</h2>
        <Link href="/crm/leads" className="notion-button text-muted-foreground mt-2">
          <span className="material-icons-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{lead.firstName} {lead.lastName}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{lead.company} · {lead.projectName}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="notion-button border border-border text-sm">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>content_copy</span>
            Duplicate
          </button>
          <button className="notion-button border border-border text-sm">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>archive</span>
            Archive
          </button>
          <button className="notion-button border border-border text-sm">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>edit</span>
            Edit
          </button>
          <button className="notion-button bg-green-600 text-white hover:bg-green-700 text-sm">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>person_add</span>
            Convert to Client
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-3">
        <LeadStatusBadge status={lead.status} withDot />
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="material-icons-outlined" style={{ fontSize: 14 }}>calendar_today</span>
            Created {lead.createdAt}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-icons-outlined" style={{ fontSize: 14 }}>event</span>
            Follow-up {lead.nextFollowUp}
          </span>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <DetailSection title="Overview">
            <div className="grid grid-cols-1 gap-3">
              <DetailField label="Status" value={<LeadStatusBadge status={lead.status} />} />
              <DetailField label="Budget" value={formatBudget(lead.estimatedBudget)} />
              <DetailField label="Project Type" value={lead.projectType} />
              <DetailField label="Expected Start" value={lead.expectedStartDate} />
              <DetailField label="Lead Source" value={lead.leadSource} />
              <DetailField label="Assigned Designer" value={lead.assignedDesigner} />
            </div>
          </DetailSection>

          <DetailSection title="Contact Details">
            <div className="space-y-3">
              <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm hover:underline">
                <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 16 }}>email</span>
                <span>{lead.email}</span>
              </a>
              <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm hover:underline">
                <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 16 }}>phone</span>
                <span>{lead.phone}</span>
              </a>
              <div className="flex items-start gap-2 text-sm">
                <span className="material-icons-outlined text-muted-foreground flex-shrink-0 mt-0.5" style={{ fontSize: 16 }}>location_on</span>
                <span className="text-muted-foreground">{lead.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 16 }}>chat</span>
                <span className="text-muted-foreground">Preferred: {lead.preferredContact}</span>
              </div>
            </div>
          </DetailSection>
        </div>

        {/* Right columns */}
        <div className="lg:col-span-2 space-y-4">
          <DetailSection title="Tasks" action={{ label: '+ Task', onClick: () => {} }}>
            <TaskList tasks={lead.tasks} />
          </DetailSection>

          <DetailSection title="Notes">
            <NotesPanel notes={lead.notes} />
          </DetailSection>

          <DetailSection title="Timeline">
            <Timeline events={[...lead.timeline].reverse()} />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
