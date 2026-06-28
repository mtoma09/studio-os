'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Schedule, ScheduleSection as ScheduleSectionType, ScheduleProduct,
  ProductFlag, createEmptyProduct, createEmptySection, productStatusConfig,
} from '@/lib/schedules-data';
import { ScheduleSection } from './ScheduleSection';
import { ExportScheduleModal } from './ExportScheduleModal';

interface ScheduleBuilderProps {
  schedule: Schedule;
  onChange: (schedule: Schedule) => void;
}

const SORT_OPTIONS = [
  { label: 'Product Name', value: 'name' },
  { label: 'Supplier', value: 'supplier' },
  { label: 'Section', value: 'section' },
  { label: 'Last Updated', value: 'updated' },
  { label: 'Created', value: 'created' },
];

const FILTER_OPTIONS = ['All', 'Draft', 'Pending Approval', 'Approved', 'Ordered', 'Installed', 'Archived', 'Flagged'];

export function ScheduleBuilder({ schedule, onChange }: ScheduleBuilderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  // Drag state
  const [dragProductId, setDragProductId] = useState<string | null>(null);
  const [dragSectionId, setDragSectionId] = useState<string | null>(null);
  const [dragOverProductId, setDragOverProductId] = useState<string | null>(null);

  const updateSchedule = useCallback((updater: (draft: Schedule) => void) => {
    const draft: Schedule = JSON.parse(JSON.stringify(schedule));
    updater(draft);
    onChange(draft);
  }, [schedule, onChange]);

  // ── Product handlers ───────────────────────────────────────────────────────

  const handleSelectProduct = useCallback((id: string, checked: boolean) => {
    setSelectedProducts(prev => checked ? [...prev, id] : prev.filter(p => p !== id));
  }, []);

  const handleUpdateProduct = useCallback((productId: string, updated: ScheduleProduct) => {
    updateSchedule(draft => {
      draft.sections = draft.sections.map(sec => ({
        ...sec,
        products: sec.products.map(p => p.id === productId ? updated : p),
      }));
    });
  }, [updateSchedule]);

  const handleDeleteProduct = useCallback((productId: string) => {
    updateSchedule(draft => {
      draft.sections = draft.sections.map(sec => ({
        ...sec,
        products: sec.products.filter(p => p.id !== productId),
      }));
    });
    setSelectedProducts(prev => prev.filter(id => id !== productId));
  }, [updateSchedule]);

  const handleDuplicateProduct = useCallback((productId: string) => {
    updateSchedule(draft => {
      draft.sections = draft.sections.map(sec => {
        const idx = sec.products.findIndex(p => p.id === productId);
        if (idx === -1) return sec;
        const copy: ScheduleProduct = {
          ...sec.products[idx],
          id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: sec.products[idx].name ? `${sec.products[idx].name} (Copy)` : '',
          order: idx + 1,
        };
        const products = [...sec.products];
        products.splice(idx + 1, 0, copy);
        return { ...sec, products: products.map((p, i) => ({ ...p, order: i })) };
      });
    });
  }, [updateSchedule]);

  const handleAddProductBelow = useCallback((productId: string) => {
    updateSchedule(draft => {
      draft.sections = draft.sections.map(sec => {
        const idx = sec.products.findIndex(p => p.id === productId);
        if (idx === -1) return sec;
        const products = [...sec.products];
        products.splice(idx + 1, 0, createEmptyProduct(idx + 1));
        return { ...sec, products: products.map((p, i) => ({ ...p, order: i })) };
      });
    });
  }, [updateSchedule]);

  const handleAddProduct = useCallback((sectionId: string) => {
    updateSchedule(draft => {
      const sec = draft.sections.find(s => s.id === sectionId);
      if (sec) sec.products.push(createEmptyProduct(sec.products.length));
    });
  }, [updateSchedule]);

  const handleMoveProductToSection = useCallback((productId: string, targetSectionId: string) => {
    updateSchedule(draft => {
      let moved: ScheduleProduct | null = null;
      draft.sections = draft.sections.map(sec => {
        const product = sec.products.find(p => p.id === productId);
        if (product) {
          moved = { ...product };
          return { ...sec, products: sec.products.filter(p => p.id !== productId) };
        }
        return sec;
      });
      if (moved) {
        const product = moved;
        draft.sections = draft.sections.map(sec => {
          if (sec.id === targetSectionId) return { ...sec, products: [...sec.products, product] };
          return sec;
        });
      }
    });
  }, [updateSchedule]);

  const handleArchiveProduct = useCallback((productId: string) => {
    updateSchedule(draft => {
      draft.sections = draft.sections.map(sec => ({
        ...sec,
        products: sec.products.map(p => p.id === productId ? { ...p, status: 'Archived' as const } : p),
      }));
    });
  }, [updateSchedule]);

  const handleAddFlagToProduct = useCallback((productId: string, flag: ProductFlag) => {
    updateSchedule(draft => {
      draft.sections = draft.sections.map(sec => ({
        ...sec,
        products: sec.products.map(p => {
          if (p.id !== productId) return p;
          const flags = p.flags.includes(flag) ? p.flags.filter(f => f !== flag) : [...p.flags, flag];
          return { ...p, flags };
        }),
      }));
    });
  }, [updateSchedule]);

  // ── Section handlers ───────────────────────────────────────────────────────

  const handleToggleCollapse = useCallback((sectionId: string) => {
    updateSchedule(draft => {
      draft.sections = draft.sections.map(sec =>
        sec.id === sectionId ? { ...sec, collapsed: !sec.collapsed } : sec
      );
    });
  }, [updateSchedule]);

  const handleRenameSection = useCallback((sectionId: string, name: string) => {
    updateSchedule(draft => {
      draft.sections = draft.sections.map(sec =>
        sec.id === sectionId ? { ...sec, name } : sec
      );
    });
  }, [updateSchedule]);

  const handleDeleteSection = useCallback((sectionId: string) => {
    updateSchedule(draft => {
      draft.sections = draft.sections.filter(sec => sec.id !== sectionId);
    });
  }, [updateSchedule]);

  const handleAddSection = useCallback(() => {
    updateSchedule(draft => {
      draft.sections.push(createEmptySection(draft.sections.length));
    });
  }, [updateSchedule]);

  const handleMoveSectionUp = useCallback((sectionId: string) => {
    updateSchedule(draft => {
      const idx = draft.sections.findIndex(s => s.id === sectionId);
      if (idx <= 0) return;
      [draft.sections[idx - 1], draft.sections[idx]] = [draft.sections[idx], draft.sections[idx - 1]];
      draft.sections = draft.sections.map((s, i) => ({ ...s, order: i }));
    });
  }, [updateSchedule]);

  const handleMoveSectionDown = useCallback((sectionId: string) => {
    updateSchedule(draft => {
      const idx = draft.sections.findIndex(s => s.id === sectionId);
      if (idx >= draft.sections.length - 1) return;
      [draft.sections[idx], draft.sections[idx + 1]] = [draft.sections[idx + 1], draft.sections[idx]];
      draft.sections = draft.sections.map((s, i) => ({ ...s, order: i }));
    });
  }, [updateSchedule]);

  // ── Drag and Drop ─────────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, productId: string, sectionId: string) => {
    setDragProductId(productId);
    setDragSectionId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, productId: string, sectionId: string) => {
    e.preventDefault();
    setDragOverProductId(productId);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetProductId: string, targetSectionId: string) => {
    e.preventDefault();
    if (!dragProductId || dragProductId === targetProductId) {
      setDragProductId(null); setDragSectionId(null); setDragOverProductId(null);
      return;
    }
    updateSchedule(draft => {
      let movedProduct: ScheduleProduct | null = null;
      draft.sections = draft.sections.map(sec => {
        const idx = sec.products.findIndex(p => p.id === dragProductId);
        if (idx === -1) return sec;
        movedProduct = { ...sec.products[idx] };
        return { ...sec, products: sec.products.filter(p => p.id !== dragProductId) };
      });
      if (!movedProduct) return;
      const product = movedProduct;
      draft.sections = draft.sections.map(sec => {
        if (sec.id !== targetSectionId) return sec;
        const idx = sec.products.findIndex(p => p.id === targetProductId);
        if (idx === -1) return sec;
        const products = [...sec.products];
        products.splice(idx, 0, product);
        return { ...sec, products: products.map((p, i) => ({ ...p, order: i })) };
      });
    });
    setDragProductId(null); setDragSectionId(null); setDragOverProductId(null);
  }, [dragProductId, updateSchedule]);

  const handleDragEnd = useCallback(() => {
    setDragProductId(null); setDragSectionId(null); setDragOverProductId(null);
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const all = schedule.sections.flatMap(s => s.products);
    return {
      total: all.length,
      approved: all.filter(p => p.status === 'Approved').length,
      pending: all.filter(p => p.status === 'Pending Approval').length,
      ordered: all.filter(p => p.status === 'Ordered').length,
      totalCost: all.reduce((s, p) => s + parseFloat(p.unitCost || '0') * parseFloat(p.quantity || '1'), 0),
    };
  }, [schedule]);

  // ── Filtered sections ──────────────────────────────────────────────────────

  const displaySections = useMemo(() => {
    return schedule.sections.map(sec => {
      if (!searchQuery && filterStatus === 'All') return sec;
      const products = sec.products.filter(p => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery || [p.name, p.brand, p.supplier, p.docCode, p.description, p.productType, p.sku, p.material, p.finish, p.notes]
          .some(v => v?.toLowerCase().includes(q));
        const matchesFilter = filterStatus === 'All' ? true
          : filterStatus === 'Flagged' ? p.flags.length > 0
          : p.status === filterStatus;
        return matchesSearch && matchesFilter;
      });
      return { ...sec, products };
    }).filter(sec => {
      if (!searchQuery && filterStatus === 'All') return true;
      return sec.products.length > 0;
    });
  }, [schedule.sections, searchQuery, filterStatus]);

  const allFilteredProducts = displaySections.flatMap(s => s.products);
  const activeFilterLabel = filterStatus !== 'All' ? filterStatus : null;
  const activeSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label ?? 'Sort';

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">

        {/* Search */}
        <div className="relative flex-shrink-0">
          <span className="material-icons-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" style={{ fontSize: 16 }}>search</span>
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg bg-background w-52 placeholder:text-muted-foreground outline-none focus:border-foreground/30 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <span className="material-icons-outlined" style={{ fontSize: 14 }}>close</span>
            </button>
          )}
        </div>

        {/* Filter — icon only */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            title="Filter"
            className={`flex items-center justify-center w-9 h-9 border rounded-lg transition-colors ${
              activeFilterLabel ? 'border-foreground/30 bg-muted text-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <span className="material-icons-outlined" style={{ fontSize: 18 }}>filter_list</span>
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute left-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg z-30 py-1">
                {FILTER_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setFilterStatus(opt); setShowFilterMenu(false); }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${
                      filterStatus === opt ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {opt}
                    {filterStatus === opt && <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sort — icon only */}
        <div className="relative">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            title="Sort"
            className="flex items-center justify-center w-9 h-9 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="material-icons-outlined" style={{ fontSize: 18 }}>sort</span>
          </button>
          {showSortMenu && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
              <div className="absolute left-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg z-30 py-1">
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Sort By</p>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortMenu(false); }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${
                      sortBy === opt.value ? 'font-medium text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.value && <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>}
                  </button>
                ))}
                <div className="border-t border-border my-1" />
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Order</p>
                <button
                  onClick={() => { setSortOrder('asc'); setShowSortMenu(false); }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${sortOrder === 'asc' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  Ascending
                  {sortOrder === 'asc' && <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>}
                </button>
                <button
                  onClick={() => { setSortOrder('desc'); setShowSortMenu(false); }}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-left ${sortOrder === 'desc' ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                >
                  Descending
                  {sortOrder === 'desc' && <span className="material-icons-outlined" style={{ fontSize: 14 }}>check</span>}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        {/* Stats */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-muted-foreground pr-2">
          <span>{stats.total} products</span>
          <span className="w-px h-3 bg-border" />
          <span className="text-green-600 dark:text-green-400">{stats.approved} approved</span>
          <span className="w-px h-3 bg-border" />
          <span className="font-medium text-foreground">
            A${stats.totalCost.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Bulk actions */}
        {selectedProducts.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowBulkMenu(!showBulkMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <span className="material-icons-outlined" style={{ fontSize: 15 }}>checklist</span>
              {selectedProducts.length} selected
              <span className="material-icons-outlined" style={{ fontSize: 14 }}>expand_more</span>
            </button>
            {showBulkMenu && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setShowBulkMenu(false)} />
                <div className="absolute right-0 mt-1 w-52 bg-popover border border-border rounded-xl shadow-lg z-30 py-1">
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Bulk Actions</p>
                  <button onClick={() => { selectedProducts.forEach(id => { const p = allFilteredProducts.find(p => p.id === id); if (p) handleUpdateProduct(id, { ...p, status: 'Approved' }); }); setShowBulkMenu(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">Change Status</button>
                  <button className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">Copy to Project</button>
                  <button onClick={() => { setShowExportModal(true); setShowBulkMenu(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">Export PDF Schedule</button>
                  <div className="border-t border-border my-1" />
                  <button onClick={() => { selectedProducts.forEach(id => handleArchiveProduct(id)); setSelectedProducts([]); setShowBulkMenu(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">Archive Selected</button>
                  <button onClick={() => { selectedProducts.forEach(id => handleDeleteProduct(id)); setSelectedProducts([]); setShowBulkMenu(false); }} className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-red-500 hover:text-red-600">Remove Selected</button>
                  <div className="border-t border-border my-1" />
                  <button onClick={() => setSelectedProducts([])} className="w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">Clear Selection</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Export */}
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <span className="material-icons-outlined" style={{ fontSize: 15 }}>picture_as_pdf</span>
          Export
        </button>

        {/* New Section */}
        <button
          onClick={handleAddSection}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium"
        >
          <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
          New Section
        </button>
      </div>

      {/* ── Schedule Content — sits directly on page ── */}
      <div className="pb-8">
        {displaySections.map((section, sectionIndex) => (
          <ScheduleSection
            key={section.id}
            section={section}
            allSections={schedule.sections}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onDuplicateProduct={handleDuplicateProduct}
            onAddProductBelow={handleAddProductBelow}
            onAddProduct={() => handleAddProduct(section.id)}
            onMoveProductToSection={handleMoveProductToSection}
            onArchiveProduct={handleArchiveProduct}
            onAddFlagToProduct={handleAddFlagToProduct}
            onToggleCollapse={() => handleToggleCollapse(section.id)}
            onRenameSection={(name) => handleRenameSection(section.id, name)}
            onDeleteSection={() => handleDeleteSection(section.id)}
            onMoveUp={() => handleMoveSectionUp(section.id)}
            onMoveDown={() => handleMoveSectionDown(section.id)}
            canMoveUp={sectionIndex > 0}
            canMoveDown={sectionIndex < displaySections.length - 1}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            dragOverProductId={dragOverProductId}
          />
        ))}

        {/* Add section */}
        <div className="px-4 pt-4">
          <button
            onClick={handleAddSection}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-xl px-4 py-3 w-full justify-center hover:bg-muted/20 transition-all"
          >
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
            Add Section
          </button>
        </div>

        {/* Empty state */}
        {schedule.sections.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <span className="material-icons-outlined mb-3 block" style={{ fontSize: 44 }}>table_chart</span>
            <p className="text-sm font-medium mb-1">No sections yet</p>
            <p className="text-xs mb-5">Add your first section to start building this schedule</p>
            <button
              onClick={handleAddSection}
              className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors font-medium text-sm"
            >
              <span className="material-icons-outlined" style={{ fontSize: 18 }}>add</span>
              Add Section
            </button>
          </div>
        )}

        {displaySections.length === 0 && schedule.sections.length > 0 && (searchQuery || filterStatus !== 'All') && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No products match your filters</p>
            <button onClick={() => { setSearchQuery(''); setFilterStatus('All'); }} className="text-xs hover:underline mt-2">Clear filters</button>
          </div>
        )}
      </div>

      {showExportModal && (
        <ExportScheduleModal
          schedule={schedule}
          selectedProducts={selectedProducts}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}
