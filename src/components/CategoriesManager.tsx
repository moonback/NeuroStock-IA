import { useState, FormEvent } from 'react';
import { Plus, Edit2, Trash2, HelpCircle, RefreshCw, X, Check, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryItem, InventoryItem } from '../types';
import { upsertCategory, deleteCategory } from '../lib/supabaseCategories';
import { suggestCategory } from '../lib/autoCategorization';
import { syncInventoryItem } from '../lib/inventorySync';
import { triggerHaptic } from '../lib/haptics';
import { ConfirmModal } from './ui/ConfirmModal';
import { CategoryModal } from './CategoryModal';

interface CategoriesManagerProps {
  categories: CategoryItem[];
  inventory: InventoryItem[];
  onRefreshCategories: () => Promise<void>;
  onRefreshInventory: () => Promise<void>;
  showToast: (text: string) => void;
}

const COMMON_EMOJIS = [
  '🥛', '🍖', '🐟', '🥫', '🍝', '🍚', '🥦', '🍎', '🍪', '🍫', '🥤', '🧂', '🧊', '🧹', '🧻',
  '🍞', '🥐', '🥩', '🧀', '🥚', '🍯', '🍵', '🍷', '🍺', '🧴', '🧼', '💊', '🔋', '📦', '🏷️',
];

export function CategoriesManager({
  categories,
  inventory,
  onRefreshCategories,
  onRefreshInventory,
  showToast,
}: CategoriesManagerProps) {
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Auto categorize
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

  // Confirm modal
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const pendingDeleteCategory = categories.find((c) => c.id === confirmDeleteId) ?? null;

  const openCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const openEditModal = (category: CategoryItem) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleSave = async (categoryToSave: CategoryItem) => {
    const previousCategoryName = editingCategory?.name;

    await upsertCategory(categoryToSave);

    let renamedProductsCount = 0;
    if (previousCategoryName && previousCategoryName !== categoryToSave.name) {
      const previousNameLower = previousCategoryName.trim().toLowerCase();
      const productsToRename = inventory.filter(
        (item) => item.category?.trim().toLowerCase() === previousNameLower,
      );

      for (const item of productsToRename) {
        await syncInventoryItem({
          ...item,
          category: categoryToSave.name,
          lastUpdated: Date.now(),
        });
        renamedProductsCount++;
      }
    }

    showToast(
      editingCategory
        ? renamedProductsCount > 0
          ? `Catégorie modifiée et ${renamedProductsCount} produit(s) déplacé(s) !`
          : 'Catégorie modifiée !'
        : 'Catégorie créée !',
    );
    if (previousCategoryName && selectedCategoryName === previousCategoryName) {
      setSelectedCategoryName(categoryToSave.name);
    }

    await onRefreshCategories();
    if (renamedProductsCount > 0) {
      await onRefreshInventory();
    }
  };

  const handleDeleteConfirm = async () => {
    const category = pendingDeleteCategory;
    if (!category?.id) return;

    triggerHaptic('warning');
    try {
      await deleteCategory(category.id);
      showToast('Catégorie supprimée.');
      if (selectedCategoryName === category.name) {
        setSelectedCategoryName(null);
      }
      await onRefreshCategories();
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la suppression.');
    } finally {
      setConfirmDeleteId(null);
    }
  };

  const handleAutoCategorize = async () => {
    setIsAutoCategorizing(true);
    triggerHaptic('success');
    let updatedCount = 0;

    try {
      for (const item of inventory) {
        const currentCat = item.category?.trim();
        const hasValidCat = currentCat && categories.some(
          (c) => c.name.toLowerCase() === currentCat.toLowerCase(),
        );

        if (!hasValidCat) {
          const suggested = suggestCategory(item.name, item.category, categories);
          if (suggested && suggested !== currentCat) {
            const updatedItem: InventoryItem = {
              ...item,
              category: suggested,
              lastUpdated: Date.now(),
            };
            await syncInventoryItem(updatedItem);
            updatedCount++;
          }
        }
      }

      if (updatedCount > 0) {
        showToast(`${updatedCount} produit(s) classé(s) automatiquement !`);
        await onRefreshInventory();
      } else {
        showToast('Aucun produit à classer automatiquement.');
      }
    } catch (err) {
      console.error(err);
      showToast('Erreur lors du classement automatique.');
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/15 sm:h-11 sm:w-11">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 tracking-tight sm:text-lg">Catégories</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-[10px] font-black text-slate-500 tabular-nums">
                  {categories.length} {categories.length > 1 ? 'catégories' : 'catégorie'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:flex">
            <button
              type="button"
              onClick={openCreateModal}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-[10px] font-black text-white shadow-md shadow-indigo-600/15 transition hover:bg-indigo-700 active:scale-[0.98] select-none cursor-pointer sm:flex-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Nouvelle
            </button>
          </div>
        </div>
      </div>

      {/* Categories Grid List */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-400 border border-dashed border-slate-300 rounded-2xl bg-slate-50/60">
          <HelpCircle className="h-7 w-7 text-slate-300" />
          <span className="text-xs font-semibold text-slate-500">Aucune catégorie configurée</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categories.map((category) => {
            const associatedProducts = inventory.filter(
              (item) => item.category?.trim().toLowerCase() === category.name.trim().toLowerCase(),
            );
            const count = associatedProducts.length;
            const isSelected = selectedCategoryName === category.name;

            return (
              <div
                key={category.id || category.name}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
                style={{ touchAction: 'pan-y' }}
              >
                {/* Swipe background */}
                <div className="absolute inset-0 flex items-stretch">
                  <div className="w-28 bg-indigo-500 flex items-center justify-start pl-4 rounded-l-2xl">
                    <Edit2 className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 bg-rose-500 flex items-center justify-center rounded-r-2xl">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Foreground card */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -120, right: 0 }}
                  dragElastic={0.08}
                  onDragEnd={(_: any, info: any) => {
                    if (info.offset.x < -70) {
                      triggerHaptic('light');
                      openEditModal(category);
                    } else if (info.offset.x > 70) {
                      triggerHaptic('warning');
                      setConfirmDeleteId(category.id ?? category.name);
                    }
                  }}
                  onClick={() => setSelectedCategoryName(isSelected ? null : category.name)}
                  className="relative z-10 bg-white border-0"
                  whileTap={{ cursor: 'grabbing' }}
                >
                  <div className="flex min-h-[4.25rem] w-full items-center justify-between p-3 pr-20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg border border-slate-200">
                        {category.icon || '📦'}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{category.name}</h4>
                        <span className="text-[10px] font-bold text-slate-400 font-mono tabular">
                          {count} {count > 1 ? 'articles' : 'article'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Hover actions (desktop) */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditModal(category);
                      }}
                      className="h-9 w-9 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        triggerHaptic('warning');
                        setConfirmDeleteId(category.id ?? category.name);
                      }}
                      className="h-9 w-9 flex items-center justify-center text-rose-500 hover:text-rose-700 rounded-xl hover:bg-rose-50 transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <AnimatePresence initial={false}>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Produits associés
                            </span>
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                              {associatedProducts.length}
                            </span>
                          </div>

                          {associatedProducts.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-4 text-center text-[10px] font-semibold text-slate-400">
                              Aucun produit dans cette catégorie.
                            </div>
                          ) : (
                            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                              {associatedProducts.map((item) => (
                                <div
                                  key={item.barcode}
                                  className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-2"
                                >
                                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-slate-200 bg-white p-1">
                                    {item.imageUrl ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.name}
                                        className="h-full w-full rounded object-contain"
                                      />
                                    ) : (
                                      <Package className="h-4 w-4 text-slate-300" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h5 className="line-clamp-1 text-[11px] font-bold text-slate-800">
                                      {item.name}
                                    </h5>
                                    <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
                                      {item.barcode}{item.brand ? ` • ${item.brand}` : ''}
                                    </p>
                                  </div>
                                  <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-mono text-[10px] font-bold tabular text-indigo-600">
                                    x{item.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal create/edit */}
      <CategoryModal
        isOpen={isModalOpen}
        category={editingCategory}
        categoryId={editingCategory?.id ?? 'create'}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        showToast={showToast}
      />

      {/* Confirm delete */}
      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title={pendingDeleteCategory ? `Supprimer "${pendingDeleteCategory.name}" ?` : 'Supprimer la catégorie ?'}
        message={
          pendingDeleteCategory
            ? pendingDeleteCategory.icon
              ? `${pendingDeleteCategory.icon} ${pendingDeleteCategory.name}`
              : pendingDeleteCategory.name
            : ''
        }
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </section>
  );
}
