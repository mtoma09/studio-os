'use client';

import { ReactNode, useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { DesignerProvider } from '@/lib/designer-context';
import { NotificationProvider } from '@/lib/notification-context';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserMenu } from '@/components/UserMenu';
import { mockProjects } from '@/lib/projects-data';
import { mockClients, mockLeads } from '@/lib/crm-data';

// ── Theme Toggle (pill switch style) ─────────────────────────────────────────
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-14 h-7" />;
  const isDark = resolvedTheme === 'dark';
  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
        isDark ? 'bg-foreground/30' : 'bg-foreground/15'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card flex items-center justify-center shadow-sm transition-transform duration-300 ${
          isDark ? 'translate-x-6' : 'translate-x-0'
        }`}
      >
        <span className="material-icons-outlined text-foreground" style={{ fontSize: 12 }}>
          {isDark ? 'dark_mode' : 'light_mode'}
        </span>
      </span>
    </button>
  );
}

// ── Nav items ─────────────────────────────────────────────────────────────────
const topNav = [
  { href: '/dashboard', iconFilled: 'dashboard', iconOutlined: 'dashboard', label: 'Dashboard' },
  { href: '/projects', iconFilled: 'folder', iconOutlined: 'folder_open', label: 'Projects' },
];
const crmChildren = [
  { href: '/crm/leads', icon: 'person_add', label: 'Leads' },
  { href: '/crm/clients', icon: 'people', label: 'Clients' },
];
const bottomNav = [
  { href: '/procurement', icon: 'store', label: 'Vendor Library' },
  { href: '/tasks', icon: 'task_alt', label: 'Tasks' },
  { href: '/finance', icon: 'receipt_long', label: 'Finance' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
];

// ── Hardcoded vendor + task search data ──────────────────────────────────────
const hardcodedVendors = [
  { label: 'Luxury Lighting Co.', sub: 'Lighting', href: '/procurement' },
  { label: 'Artisan Furniture Co.', sub: 'Furniture', href: '/procurement' },
  { label: 'Premium Fabrics Ltd', sub: 'Textiles', href: '/procurement' },
  { label: 'Stone & Tile World', sub: 'Finishes', href: '/procurement' },
  { label: 'Bespoke Cabinetry', sub: 'Furniture', href: '/procurement' },
  { label: 'Nordic Light House', sub: 'Lighting', href: '/procurement' },
  { label: 'Coastal Decor Studio', sub: 'Decor', href: '/procurement' },
  { label: 'Elite Hardware', sub: 'Hardware', href: '/procurement' },
];
const hardcodedTasks = [
  { label: 'Kitchen Layout Review', sub: 'Hampton Residence', href: '/tasks' },
  { label: 'Material Board Presentation', sub: 'Darling Point Apartment', href: '/tasks' },
  { label: 'Site Measure', sub: 'Vaucluse House', href: '/tasks' },
  { label: 'Client Brief Sign-Off', sub: 'Mosman Terrace', href: '/tasks' },
  { label: 'FF&E Schedule Draft', sub: 'Rose Bay Villa', href: '/tasks' },
];

type SearchResult = { type: string; label: string; sub?: string; href: string };

// ── Global Search ─────────────────────────────────────────────────────────────
function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('mousedown', handler); document.removeEventListener('keydown', key); };
  }, []);

  const results = useMemo((): { group: string; items: SearchResult[] }[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const projects = mockProjects
      .filter(p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q))
      .slice(0, 4)
      .map(p => ({ type: 'Projects', label: p.name, sub: p.address, href: `/projects/${p.id}` }));

    const clients = mockClients
      .filter(c => c.primaryContact.toLowerCase().includes(q) || c.company.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({ type: 'Clients', label: c.primaryContact, sub: c.company, href: `/crm/clients/${c.id}` }));

    const leads = mockLeads
      .filter(l => `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) || l.company.toLowerCase().includes(q))
      .slice(0, 3)
      .map(l => ({ type: 'Leads', label: `${l.firstName} ${l.lastName}`, sub: l.company, href: `/crm/leads/${l.id}` }));

    const vendors = hardcodedVendors
      .filter(v => v.label.toLowerCase().includes(q) || v.sub.toLowerCase().includes(q))
      .slice(0, 3)
      .map(v => ({ type: 'Vendors', ...v }));

    const tasks = hardcodedTasks
      .filter(t => t.label.toLowerCase().includes(q))
      .slice(0, 3)
      .map(t => ({ type: 'Tasks', ...t }));

    const grouped: { group: string; items: SearchResult[] }[] = [];
    if (projects.length) grouped.push({ group: 'Projects', items: projects });
    if (clients.length) grouped.push({ group: 'Clients', items: clients });
    if (leads.length) grouped.push({ group: 'Leads', items: leads });
    if (vendors.length) grouped.push({ group: 'Vendors', items: vendors });
    if (tasks.length) grouped.push({ group: 'Tasks', items: tasks });
    return grouped;
  }, [query]);

  function Highlight({ text }: { text: string }) {
    const q = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1 || !query) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-foreground/10 text-foreground rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <div className="relative w-52" ref={ref}>
      <span className="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: 15 }}>search</span>
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results.length > 0) window.location.href = results[0].items[0].href;
        }}
        className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-white/40 placeholder:text-muted-foreground outline-none focus:border-foreground/20 transition-colors"
      />
      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl z-[60] overflow-hidden">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">No results found</p>
          ) : (
            <div className="max-h-80 dropdown-scroll">
              {results.map(({ group, items }) => (
                <div key={group}>
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b border-border/40 bg-muted/20 uppercase tracking-wide">{group}</p>
                  {items.map((item, i) => (
                    <Link key={i} href={item.href} onClick={() => { setOpen(false); setQuery(''); }}
                      className="flex items-start gap-2 px-3 py-2.5 hover:bg-muted transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground leading-tight"><Highlight text={item.label} /></p>
                        {item.sub && <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.sub}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
function AppLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  }

  function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
    const active = isActive(href);
    return (
      <Link href={href}
        className={`sidebar-item ${active ? 'sidebar-item-active' : 'sidebar-item-hover text-muted-foreground'}`}>
        <span className={`${active ? 'material-icons' : 'material-icons-outlined'} nav-icon`} style={{ fontSize: 17 }}>{icon}</span>
        <span className="nav-label text-[13px]">{label}</span>
      </Link>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar — transparent background */}
      <aside className="w-52 flex-shrink-0 flex flex-col">
        {/* Logo — no border beneath */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <Link href="/dashboard">
            <Image src="/logo.png" alt="StudioOS" width={175} height={76}
              style={{ width: 140, height: 'auto' }} priority />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-1 space-y-0.5 overflow-y-auto">
          {topNav.map((item) => (
            <NavItem key={item.href} href={item.href} icon={isActive(item.href) ? item.iconFilled : item.iconOutlined} label={item.label} />
          ))}

          {/* CRM heading */}
          <div className="pt-4 pb-0.5 px-2.5 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#333333' }}>CRM</span>
          </div>
          <div className="flex items-start gap-0 pl-3">
            <div className="flex flex-col flex-1 space-y-0.5">
              {crmChildren.map((child) => {
                const active = isActive(child.href);
                return (
                  <Link key={child.href} href={child.href}
                    className={`sidebar-item pl-2 ${active ? 'sidebar-item-active' : 'sidebar-item-hover text-muted-foreground'}`}>
                    <span className={`${active ? 'material-icons' : 'material-icons-outlined'} nav-icon`} style={{ fontSize: 15 }}>{child.icon}</span>
                    <span className="nav-label text-[13px]">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/50 mx-2 my-1.5" />

          {/* Bottom nav */}
          {bottomNav.map((item) => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header — transparent, no border */}
        <header className="h-14 flex-shrink-0 sticky top-0 z-10 px-4 flex items-center justify-end gap-2.5">
          <GlobalSearch />
          <ThemeToggle />
          <NotificationCenter />
          <UserMenu />
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="px-6 pb-6 pt-4">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <DesignerProvider>
      <NotificationProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </NotificationProvider>
    </DesignerProvider>
  );
}
