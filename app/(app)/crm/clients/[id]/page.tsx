'use client';

import Link from 'next/link';
import { mockClients, formatBudget } from '@/lib/crm-data';
import { ClientStatusBadge } from '@/components/crm/StatusBadge';
import { Timeline } from '@/components/crm/Timeline';
import { NotesPanel } from '@/components/crm/NotesPanel';
import { DetailSection, DetailField } from '@/components/crm/DetailSection';

const projectStatusColors: Record<string, string> = {
  Active:    'bg-blue-50 text-blue-700',
  Completed: 'bg-green-50 text-green-700',
  'On Hold': 'bg-gray-100 text-gray-600',
  Planned:   'bg-purple-50 text-purple-700',
};

interface Props {
  params: { id: string };
}

export default function ClientDetailPage({ params }: Props) {
  const { id } = params;
  const client = mockClients.find((c) => c.id === id);

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <span className="material-icons-outlined text-muted-foreground mb-3" style={{ fontSize: 48 }}>badge</span>
        <h2 className="font-medium text-lg mb-1">Client not found</h2>
        <Link href="/crm/clients" className="notion-button text-muted-foreground mt-2">
          <span className="material-icons-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Back to Clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold">{client.primaryContact}</h1>
            <ClientStatusBadge status={client.status} />
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{client.company} · Client since {client.clientSince}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="notion-button border border-border text-sm">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>archive</span>
            Archive
          </button>
          <button className="notion-button border border-border text-sm">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>edit</span>
            Edit
          </button>
          <button className="notion-button border border-border text-sm">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>delete_outline</span>
            Delete
          </button>
          <button className="notion-button bg-foreground text-background hover:bg-foreground/90 text-sm">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>folder_open</span>
            Create Project
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="material-icons-outlined" style={{ fontSize: 14 }}>folder</span>
          {client.projects.length} project{client.projects.length !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-icons-outlined" style={{ fontSize: 14 }}>schedule</span>
          Last contact {client.lastContact}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="material-icons-outlined" style={{ fontSize: 14 }}>person</span>
          {client.assignedDesigner}
        </span>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          <DetailSection title="Overview">
            <div className="space-y-3">
              <DetailField label="Status" value={<ClientStatusBadge status={client.status} />} />
              <DetailField label="Client Since" value={client.clientSince} />
              <DetailField label="Project Type" value={client.projectType} />
              <DetailField label="Assigned Designer" value={client.assignedDesigner} />
              {client.website && <DetailField label="Website" value={client.website} />}
            </div>
          </DetailSection>

          <DetailSection title="Contact Details">
            <div className="space-y-3">
              <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm hover:text-foreground transition-colors">
                <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 16 }}>email</span>
                <span className="text-muted-foreground hover:text-foreground">{client.email}</span>
              </a>
              <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-sm hover:text-foreground transition-colors">
                <span className="material-icons-outlined text-muted-foreground" style={{ fontSize: 16 }}>phone</span>
                <span className="text-muted-foreground hover:text-foreground">{client.phone}</span>
              </a>
              <div className="flex items-start gap-2 text-sm">
                <span className="material-icons-outlined text-muted-foreground flex-shrink-0 mt-0.5" style={{ fontSize: 16 }}>location_on</span>
                <span className="text-muted-foreground">{client.address}</span>
              </div>
            </div>
          </DetailSection>

          <DetailSection title="Contacts" action={{ label: 'Add', icon: 'add', onClick: () => {} }}>
            <div className="space-y-2">
              {client.contacts.map((contact) => (
                <div key={contact.id} className="py-2 border-b border-border/50 last:border-b-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">{contact.name}</p>
                    {contact.isPrimary && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Primary</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{contact.position}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{contact.email}</p>
                  <p className="text-xs text-muted-foreground">{contact.phone}</p>
                </div>
              ))}
            </div>
          </DetailSection>

          <DetailSection title="Billing Information" action={{ label: 'Edit', icon: 'edit', onClick: () => {} }}>
            <div className="text-sm text-muted-foreground">
              {client.billingAddress ? (
                <p>{client.billingAddress}</p>
              ) : (
                <p className="text-xs italic">No billing information on file.</p>
              )}
              {client.taxNumber && <p className="mt-1">Tax: {client.taxNumber}</p>}
            </div>
          </DetailSection>
        </div>

        {/* Right columns */}
        <div className="lg:col-span-2 space-y-4">
          <DetailSection title="Projects" action={{ label: 'Create Project', icon: undefined, onClick: () => {} }}>
            {client.projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No projects yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="table-header text-left">Project</th>
                      <th className="table-header text-left">Phase</th>
                      <th className="table-header text-left">Status</th>
                      <th className="table-header text-right">Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.projects.map((project) => (
                      <tr key={project.id} className="border-b border-border/50 last:border-b-0 hover:bg-muted/20">
                        <td className="table-cell font-medium">{project.name}</td>
                        <td className="table-cell text-muted-foreground">{project.phase}</td>
                        <td className="table-cell">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${projectStatusColors[project.status]}`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="table-cell text-right text-muted-foreground">{formatBudget(project.budget)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DetailSection>

          <DetailSection title="Notes">
            <NotesPanel notes={client.notes} />
          </DetailSection>

          <DetailSection title="Timeline">
            <Timeline events={[...client.timeline].reverse()} />
          </DetailSection>
        </div>
      </div>
    </div>
  );
}
