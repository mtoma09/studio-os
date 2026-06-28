import { Note, TimelineEvent, Task } from './crm-data';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProjectPhase =
  | 'Discovery'
  | 'Concept Design'
  | 'Schematic Design'
  | 'Design Development'
  | 'Construction Documentation'
  | 'Contract Administration'
  | 'FF&E Selection';

export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Archived';

export type ProjectType = 'Residential' | 'Commercial' | 'Hospitality' | 'Retail' | 'Multi Residential';

export interface ProjectTeam {
  projectManager: string;
  leadDesigner: string | null;
  supportDesigner: string | null;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  address: string;
  projectType: ProjectType;
  description: string;
  currentPhase: ProjectPhase;
  phaseProgress: number; // 0, 50, or 100
  status: ProjectStatus;
  estimatedBudget: number;
  startDate: string;
  targetCompletion: string;
  projectManager: string;
  builder: string | null;
  architect: string | null;
  siteNotes: string | null;
  pinned: boolean;
  coverIndex: number;
  createdAt: string;
  updatedAt: string;
  progress: number;
  team: ProjectTeam;
  notes: Note[];
  timeline: TimelineEvent[];
  tasks: Task[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

export const PROJECT_PHASES: ProjectPhase[] = [
  'Discovery',
  'Concept Design',
  'Schematic Design',
  'Design Development',
  'Construction Documentation',
  'Contract Administration',
  'FF&E Selection',
];

export const PROJECT_STATUSES: ProjectStatus[] = ['Active', 'On Hold', 'Completed', 'Archived'];

export const PROJECT_TYPES: ProjectType[] = ['Residential', 'Commercial', 'Hospitality', 'Retail', 'Multi Residential'];

export const projectStatusColors: Record<ProjectStatus, string> = {
  Active: 'bg-blue-500',
  'On Hold': 'bg-gray-400',
  Completed: 'bg-green-500',
  Archived: 'bg-slate-400',
};

export const projectStatusBadgeColors: Record<ProjectStatus, string> = {
  Active: 'bg-blue-50 text-blue-700',
  'On Hold': 'bg-gray-100 text-gray-600',
  Completed: 'bg-green-50 text-green-700',
  Archived: 'bg-slate-100 text-slate-600',
};

export const coverGradients = [
  'bg-gradient-to-br from-stone-200 to-stone-300',
  'bg-gradient-to-br from-slate-200 to-slate-300',
  'bg-gradient-to-br from-zinc-200 to-zinc-300',
  'bg-gradient-to-br from-neutral-200 to-neutral-300',
  'bg-gradient-to-br from-gray-200 to-gray-300',
  'bg-gradient-to-br from-stone-300 to-stone-400',
];

export function formatBudget(amount: number): string {
  return `A$${amount.toLocaleString('en-AU')}`;
}

export function getPhaseIndex(phase: ProjectPhase): number {
  return PROJECT_PHASES.indexOf(phase);
}

export function calculateProgress(phase: ProjectPhase): number {
  const idx = PROJECT_PHASES.indexOf(phase);
  return Math.round(((idx + 1) / PROJECT_PHASES.length) * 100);
}

// ─── Mock Projects ───────────────────────────────────────────────────────────

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'Hampton Residence',
    clientId: 'client-1',
    address: '24 Balmoral Avenue, Mosman NSW 2088',
    projectType: 'Residential',
    description: 'Full interior design for a contemporary family home featuring open-plan living, gourmet kitchen, and luxurious master suite. Coastal contemporary aesthetic with natural materials.',
    currentPhase: 'Design Development',
    phaseProgress: 50,
    status: 'Active',
    estimatedBudget: 320000,
    startDate: 'Jan 2024',
    targetCompletion: 'Jun 2025',
    projectManager: 'Ellie S.',
    builder: 'Pacific Constructions',
    architect: 'Studio Architecture',
    siteNotes: 'Site access via rear lane. Parking available on street. Council DA approved.',
    pinned: false,
    coverIndex: 0,
    createdAt: 'Jan 15, 2024',
    updatedAt: 'Dec 18, 2024',
    progress: 50,
    team: {
      projectManager: 'Ellie S.',
      leadDesigner: 'Ellie S.',
      supportDesigner: null,
    },
    notes: [
      { id: 'pn1', content: 'Client prefers warm neutral palette with timber accents. Stone selection to be finalized.', author: 'Ellie S.', createdAt: 'Mar 10, 2024' },
      { id: 'pn2', content: 'Kitchen layout finalized. Appliances confirmed with client.', author: 'Ellie S.', createdAt: 'Nov 20, 2024' },
    ],
    timeline: [
      { id: 'pt1', date: 'Jan 2024', type: 'created', title: 'Project Created', description: 'Design agreement signed' },
      { id: 'pt2', date: 'Feb 2024', type: 'meeting', title: 'Discovery Meeting', description: 'Initial site visit and brief' },
      { id: 'pt3', date: 'Apr 2024', type: 'status', title: 'Phase Changed', description: 'Moved to Concept Design' },
      { id: 'pt4', date: 'Aug 2024', type: 'meeting', title: 'Concept Presentation', description: 'Presented to James and Sarah' },
      { id: 'pt5', date: 'Oct 2024', type: 'status', title: 'Phase Changed', description: 'Moved to Design Development' },
      { id: 'pt6', date: 'Dec 18, 2024', type: 'call', title: 'Progress Call', description: 'Discussed kitchen selections' },
    ],
    tasks: [
      { id: 'ptk1', title: 'Finalize stone selection', completed: false, dueDate: 'Dec 28, 2024' },
      { id: 'ptk2', title: 'Send joinery drawings', completed: true, dueDate: 'Dec 15, 2024' },
    ],
  },
  {
    id: 'proj-2',
    name: 'Urban Loft Project',
    clientId: 'client-2',
    address: '14/22 Clarence Street, Sydney NSW 2000',
    projectType: 'Residential',
    description: 'Minimalist conversion of an industrial loft space. Japanese-inspired aesthetic with clean lines and natural materials.',
    currentPhase: 'Concept Design',
    phaseProgress: 50,
    status: 'Active',
    estimatedBudget: 180000,
    startDate: 'Mar 2024',
    targetCompletion: 'Aug 2025',
    projectManager: 'Ellie S.',
    builder: null,
    architect: null,
    siteNotes: 'Strata approval required for bathroom modifications.',
    pinned: false,
    coverIndex: 1,
    createdAt: 'Mar 20, 2024',
    updatedAt: 'Dec 12, 2024',
    progress: 50,
    team: {
      projectManager: 'Ellie S.',
      leadDesigner: 'Ellie S.',
      supportDesigner: null,
    },
    notes: [
      { id: 'pn3', content: 'Michael loves Japandi style. Wants minimalist aesthetic with hidden storage.', author: 'Ellie S.', createdAt: 'Apr 5, 2024' },
    ],
    timeline: [
      { id: 'pt7', date: 'Mar 2024', type: 'created', title: 'Project Created', description: 'Converted from lead' },
      { id: 'pt8', date: 'Jun 2024', type: 'meeting', title: 'Design Workshop', description: 'Full-day concept workshop' },
      { id: 'pt9', date: 'Dec 12, 2024', type: 'email', title: 'Concept Deck Sent', description: 'Emailed updated concepts' },
    ],
    tasks: [
      { id: 'ptk3', title: 'Develop lighting plan', completed: false, dueDate: 'Jan 5, 2025' },
    ],
  },
  {
    id: 'proj-3',
    name: 'Coastal Villa Renovation',
    clientId: 'client-3',
    address: '3 Oceanview Terrace, Bondi NSW 2026',
    projectType: 'Residential',
    description: 'Extensive renovation of a cliffside property. Open plan living with panoramic ocean views, seamless indoor-outdoor flow.',
    currentPhase: 'Construction Documentation',
    phaseProgress: 50,
    status: 'Active',
    estimatedBudget: 480000,
    startDate: 'Jun 2024',
    targetCompletion: 'Dec 2025',
    projectManager: 'Ellie S.',
    builder: 'Coastal Builders',
    architect: 'Alexandra Thompson (client)',
    siteNotes: 'Cliffside site requires engineering certification. DA for extension approved.',
    pinned: false,
    coverIndex: 2,
    createdAt: 'Jun 5, 2024',
    updatedAt: 'Dec 20, 2024',
    progress: 50,
    team: {
      projectManager: 'Ellie S.',
      leadDesigner: 'Ellie S.',
      supportDesigner: 'Anna K.',
    },
    notes: [
      { id: 'pn4', content: 'Alex is a former architect, very detail-oriented. Review all drawings carefully.', author: 'Ellie S.', createdAt: 'Jun 5, 2024' },
    ],
    timeline: [
      { id: 'pt10', date: 'Jun 2024', type: 'created', title: 'Project Created', description: 'Agreement signed' },
      { id: 'pt11', date: 'Sep 2024', type: 'invoice', title: 'Invoice Sent', description: 'INV-0018 — A$72,000' },
      { id: 'pt12', date: 'Nov 2024', type: 'meeting', title: 'Contractor Meeting', description: 'On-site with Coastal Builders' },
      { id: 'pt13', date: 'Dec 20, 2024', type: 'status', title: 'Phase Changed', description: 'Moved to Construction Documentation' },
    ],
    tasks: [
      { id: 'ptk4', title: 'Review engineering certificates', completed: false, dueDate: 'Dec 30, 2024' },
      { id: 'ptk5', title: 'Finalize bathroom layouts', completed: true, dueDate: 'Dec 15, 2024' },
    ],
  },
  {
    id: 'proj-4',
    name: 'Modern Office Space',
    clientId: 'client-4',
    address: '78 Miller Street, North Sydney NSW 2060',
    projectType: 'Commercial',
    description: 'Contemporary workplace design for a growing tech company. Agile workspaces, collaboration zones, and executive suites.',
    currentPhase: 'Schematic Design',
    phaseProgress: 50,
    status: 'Active',
    estimatedBudget: 290000,
    startDate: 'Sep 2024',
    targetCompletion: 'Mar 2025',
    projectManager: 'Ellie S.',
    builder: 'FitOut Co',
    architect: null,
    siteNotes: 'After-hours access only. Building management requires 48hr notice.',
    pinned: false,
    coverIndex: 3,
    createdAt: 'Sep 10, 2024',
    updatedAt: 'Dec 15, 2024',
    progress: 50,
    team: {
      projectManager: 'Ellie S.',
      leadDesigner: 'Ellie S.',
      supportDesigner: null,
    },
    notes: [
      { id: 'pn5', content: 'Fast-paced decision making. Ryan is main contact, Lisa handles scheduling.', author: 'Ellie S.', createdAt: 'Sep 10, 2024' },
    ],
    timeline: [
      { id: 'pt14', date: 'Sep 2024', type: 'created', title: 'Project Created', description: 'Agreement signed' },
      { id: 'pt15', date: 'Nov 2024', type: 'meeting', title: 'Schematic Review', description: 'Presented floor plan options' },
    ],
    tasks: [
      { id: 'ptk6', title: 'Develop furniture package', completed: false, dueDate: 'Jan 10, 2025' },
    ],
  },
  {
    id: 'proj-5',
    name: 'Penthouse Suite',
    clientId: 'client-5',
    address: '55 Notting Hill Boulevard, Double Bay NSW 2028',
    projectType: 'Residential',
    description: 'Luxury penthouse overlooking the harbor. Bespoke finishes, art gallery integration, and private wine cellar.',
    currentPhase: 'Discovery',
    phaseProgress: 0,
    status: 'Active',
    estimatedBudget: 620000,
    startDate: 'Oct 2024',
    targetCompletion: 'Oct 2025',
    projectManager: 'Ellie S.',
    builder: null,
    architect: 'Heritage Architects',
    siteNotes: 'Heritage constraints on external modifications. Lift access to penthouse level.',
    pinned: false,
    coverIndex: 4,
    createdAt: 'Oct 25, 2024',
    updatedAt: 'Dec 8, 2024',
    progress: 0,
    team: {
      projectManager: 'Ellie S.',
      leadDesigner: 'Ellie S.',
      supportDesigner: null,
    },
    notes: [],
    timeline: [
      { id: 'pt16', date: 'Oct 2024', type: 'created', title: 'Project Created', description: 'Converted from lead' },
      { id: 'pt17', date: 'Nov 2024', type: 'meeting', title: 'Initial Site Visit', description: 'Met Victoria at the penthouse' },
    ],
    tasks: [
      { id: 'ptk7', title: 'Prepare concept brief', completed: false, dueDate: 'Jan 15, 2025' },
    ],
  },
  {
    id: 'proj-6',
    name: 'Boutique Hotel Lobby',
    clientId: 'client-3',
    address: '100 Crown Street, Surry Hills NSW 2010',
    projectType: 'Hospitality',
    description: 'Full redesign of a boutique hotel lobby and reception. Contemporary luxury with an emphasis on guest experience.',
    currentPhase: 'FF&E Selection',
    phaseProgress: 100,
    status: 'Active',
    estimatedBudget: 520000,
    startDate: 'May 2024',
    targetCompletion: 'Feb 2025',
    projectManager: 'Ellie S.',
    builder: 'Interior FitOuts',
    architect: 'Studio Architecture',
    siteNotes: '24/7 hotel operation. Work scheduled for low-occupancy periods.',
    pinned: false,
    coverIndex: 5,
    createdAt: 'May 5, 2024',
    updatedAt: 'Dec 1, 2024',
    progress: 100,
    team: {
      projectManager: 'Ellie S.',
      leadDesigner: 'Anna K.',
      supportDesigner: 'James P.',
    },
    notes: [
      { id: 'pn6', content: 'Hotel management wants bold statement pieces. Focus on arrival experience.', author: 'Ellie S.', createdAt: 'May 10, 2024' },
    ],
    timeline: [
      { id: 'pt18', date: 'May 2024', type: 'created', title: 'Project Created', description: 'Agreement signed' },
      { id: 'pt19', date: 'Aug 2024', type: 'meeting', title: 'FF&E Review', description: 'Presented furniture options' },
      { id: 'pt20', date: 'Dec 1, 2024', type: 'status', title: 'Phase Changed', description: 'Moved to FF&E Selection' },
    ],
    tasks: [
      { id: 'ptk8', title: 'Finalize art curation', completed: false, dueDate: 'Jan 20, 2025' },
      { id: 'ptk9', title: 'Order custom reception desk', completed: true, dueDate: 'Dec 1, 2024' },
    ],
  },
];
