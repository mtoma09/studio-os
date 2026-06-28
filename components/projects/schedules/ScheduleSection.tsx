'use client';

import { useState } from 'react';
import {
  ScheduleSection as ScheduleSectionType,
  ScheduleProduct,
  ProductFlag,
} from '@/lib/schedules-data';
import { ScheduleProductCard } from './ScheduleProductCard';
import { ProductSidePanel } from './ProductSidePanel';

interface ScheduleSectionProps {
  section: ScheduleSectionType;
  allSections: ScheduleSectionType[];
  selectedProducts: string[];
  onSelectProduct: (id: string, checked: boolean) => void;
  onUpdateProduct: (productId: string, updated: ScheduleProduct) => void;
  onDeleteProduct: (productId: string) => void;
  onDuplicateProduct: (productId: string) => void;
  onAddProductBelow: (productId: string) => void;
  onAddProduct: () => void;
  onMoveProductToSection: (productId: string, sectionId: string) => void;
  onArchiveProduct: (productId: string) => void;
  onAddFlagToProduct: (productId: string, flag: ProductFlag) => void;
  onToggleCollapse: () => void;
  onRenameSection: (name: string) => void;
  onDeleteSection: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onDragStart: (e: React.DragEvent, productId: string, sectionId: string) => void;
  onDragOver: (e: React.DragEvent, productId: string, sectionId: string) => void;
  onDrop: (e: React.DragEvent, productId: string, sectionId: string) => void;
  onDragEnd: () => void;
  dragOverProductId: string | null;
}

export function ScheduleSection({
  section,
  allSections,
  selectedProducts,
  onSelectProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDuplicateProduct,
  onAddProductBelow,
  onAddProduct,
  onMoveProductToSection,
  onArchiveProduct,
  onAddFlagToProduct,
  onToggleCollapse,
  onRenameSection,
  onDeleteSection,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragOverProductId,
}: ScheduleSectionProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(section.name);
  const [showMenu, setShowMenu] = useState(false);
  const [panelProductId, setPanelProductId] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  const panelProduct = panelProductId
    ? section.products.find(p => p.id === panelProductId) ?? null
    : null;
  const panelIndex = panelProductId
    ? section.products.findIndex(p => p.id === panelProductId)
    : -1;

  const commitName = () => {
    onRenameSection(nameValue);
    setEditingName(false);
  };

  const allProducts = section.products;
  const selectedCount = selectedProducts.filter(id => allProducts.some(p => p.id === id)).length;
  const allSelected = allProducts.length > 0 && selectedCount === allProducts.length;
  const someSelected = selectedCount > 0 && selectedCount < allProducts.length;

  return (
    <>
      {panelProduct && (
        <ProductSidePanel
          product={panelProduct}
          onClose={() => setPanelProductId(null)}
          onSave={(updated) => onUpdateProduct(panelProduct.id, updated)}
          hasPrev={panelIndex > 0}
          hasNext={panelIndex < section.products.length - 1}
          onNavigatePrev={() => {
            if (panelIndex > 0) setPanelProductId(section.products[panelIndex - 1].id);
          }}
          onNavigateNext={() => {
            if (panelIndex < section.products.length - 1) setPanelProductId(section.products[panelIndex + 1].id);
          }}
        />
      )}

      {/* Lightweight section heading — no container/card wrapper */}
      <div
        className="group/section"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setShowMenu(false); }}
      >
        <div className="flex items-center gap-2.5 px-4 pt-7 pb-2.5">
          {/* Collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <span className="material-icons-outlined" style={{ fontSize: 17 }}>
              {section.collapsed ? 'chevron_right' : 'expand_more'}
            </span>
          </button>

          {/* Bulk select checkbox */}
          <input
            type="checkbox"
            checked={allSelected}
            ref={el => { if (el) el.indeterminate = someSelected; }}
            onChange={() => allProducts.forEach(p => onSelectProduct(p.id, !allSelected))}
            className={`w-3.5 h-3.5 rounded border-border cursor-pointer accent-foreground flex-shrink-0 transition-opacity ${
              hovered || selectedCount > 0 ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Section name */}
          {editingName ? (
            <input
              autoFocus
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitName();
                if (e.key === 'Escape') { setNameValue(section.name); setEditingName(false); }
              }}
              className="font-semibold text-sm bg-transparent border-b border-border outline-none py-0.5 text-foreground"
            />
          ) : (
            <h2
              onClick={() => setEditingName(true)}
              className="font-semibold text-sm cursor-text text-foreground hover:text-foreground/80 transition-colors"
            >
              {section.name}
            </h2>
          )}

          <span className="text-xs text-muted-foreground flex-shrink-0">
            {section.products.length}
          </span>

          {/* Section actions — hover only */}
          <div className={`flex items-center gap-1 ml-auto transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
            {canMoveUp && (
              <button onClick={onMoveUp} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Move up">
                <span className="material-icons-outlined" style={{ fontSize: 15 }}>arrow_upward</span>
              </button>
            )}
            {canMoveDown && (
              <button onClick={onMoveDown} className="p-1 text-muted-foreground hover:text-foreground transition-colors" title="Move down">
                <span className="material-icons-outlined" style={{ fontSize: 15 }}>arrow_downward</span>
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>more_horiz</span>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 mt-1 w-48 bg-popover border border-border rounded-xl shadow-lg z-30 py-1">
                    <button
                      onClick={() => { setEditingName(true); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
                    >
                      <span className="material-icons-outlined" style={{ fontSize: 14 }}>edit</span>
                      Rename Section
                    </button>
                    <button
                      onClick={() => { onDeleteSection(); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:text-red-600 hover:bg-muted transition-colors text-left"
                    >
                      <span className="material-icons-outlined" style={{ fontSize: 14 }}>delete_outline</span>
                      Delete Section
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Products — sit directly on the page, no wrapper */}
        {!section.collapsed && (
          <>
            {section.products.map((product) => (
              <div
                key={product.id}
                onDragOver={(e) => onDragOver(e, product.id, section.id)}
                onDrop={(e) => onDrop(e, product.id, section.id)}
                className={dragOverProductId === product.id ? 'relative before:absolute before:top-0 before:left-4 before:right-4 before:h-0.5 before:bg-blue-400 before:rounded' : ''}
              >
                <ScheduleProductCard
                  product={product}
                  sections={allSections}
                  selected={selectedProducts.includes(product.id)}
                  onSelect={onSelectProduct}
                  onUpdate={(updated) => onUpdateProduct(product.id, updated)}
                  onDelete={() => onDeleteProduct(product.id)}
                  onDuplicate={() => onDuplicateProduct(product.id)}
                  onAddBelow={() => onAddProductBelow(product.id)}
                  onMoveToSection={(sectionId) => onMoveProductToSection(product.id, sectionId)}
                  onArchive={() => onArchiveProduct(product.id)}
                  onAddFlag={(flag) => onAddFlagToProduct(product.id, flag)}
                  onOpenPanel={() => setPanelProductId(product.id)}
                  dragHandleProps={{
                    draggable: true,
                    onDragStart: (e: React.DragEvent) => onDragStart(e, product.id, section.id),
                    onDragEnd,
                  }}
                />
              </div>
            ))}

            {/* Add product row */}
            <div className="flex items-center gap-2 px-4 py-2 mb-2">
              <button
                onClick={onAddProduct}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60 rounded-lg px-3 py-1.5 hover:bg-muted/30 hover:border-border transition-all"
              >
                <span className="material-icons-outlined" style={{ fontSize: 14 }}>add</span>
                Add Product
              </button>
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60 rounded-lg px-3 py-1.5 hover:bg-muted/30 hover:border-border transition-all">
                <span className="material-icons-outlined" style={{ fontSize: 14 }}>link</span>
                Add from URL
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
