import { X, Package, Pencil, ClipboardList, Barcode, Tag, Euro, Boxes, Clock, TrendingUp } from "lucide-react";
import { InventoryItem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { useEffect } from "react";

interface ProductDetailsModalProps {
  product: InventoryItem;
  onClose: () => void;
  onEdit: () => void;
  onEditStock: () => void;
}

function formatPrice(value?: number): string {
  if (value === undefined || value === null || Number.isNaN(value)) return "Non renseigne";
  return `${value.toFixed(2)} EUR`;
}

function formatDate(value: number): string {
  if (!value) return "Non renseigne";
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "Non renseigne";
  }
}

function getStockColor(quantity: number) {
  if (quantity === 0) return { badge: "bg-rose-50 border-rose-200 text-rose-700", label: "Rupture" };
  if (quantity <= 5) return { badge: "bg-amber-50 border-amber-200 text-amber-700", label: "Stock bas" };
  return { badge: "bg-emerald-50 border-emerald-200 text-emerald-700", label: "En stock" };
}

export function ProductDetailsModal({ product, onClose, onEdit, onEditStock }: ProductDetailsModalProps) {
  const margin =
    product.purchasePrice !== undefined &&
    product.purchasePrice !== null &&
    product.salesPrice !== undefined &&
    product.salesPrice !== null
      ? product.salesPrice - product.purchasePrice
      : null;

  const stockStyle = getStockColor(product.quantity);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel — full-screen on mobile, centered sheet on desktop */}
      <motion.div
        key="panel"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed inset-x-0 bottom-0 z-[71] flex flex-col rounded-t-3xl bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-3xl"
        style={{ maxHeight: "calc(100dvh - 2rem)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-indigo-600">
              Fiche produit
            </p>
            <h2 className="mt-0.5 truncate text-base font-bold text-stone-900 leading-snug">
              {product.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-stone-900 transition active:scale-95 cursor-pointer"
            aria-label="Fermer la fiche produit"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Image + stock hero */}
          <section className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
            <div className="flex min-h-48 items-center justify-center bg-white p-6">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-44 w-full object-contain"
                />
              ) : (
                <div className="grid h-28 w-28 place-items-center rounded-3xl border border-dashed border-stone-300 bg-stone-50 text-stone-300">
                  <Package className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 bg-white px-4 py-3 space-y-3">
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                  {product.category || "Non classé"}
                </span>
                {product.brand && (
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                    {product.brand}
                  </span>
                )}
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${stockStyle.badge}`}>
                  {stockStyle.label}
                </span>
              </div>

              {/* Stock counter */}
              <div className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Stock actuel</p>
                  <p className="mt-1 text-3xl font-black text-stone-900">{product.quantity}</p>
                </div>
                {typeof product.lastMovement === "number" && (
                  <div className="rounded-xl bg-white px-3 py-2 text-right shadow-sm border border-stone-100">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      Dernier mouvement
                    </p>
                    <p className={`mt-1 text-sm font-bold ${product.lastMovement >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {product.lastMovement > 0 ? "+" : ""}
                      {product.lastMovement}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Info cards */}
          <section className="grid grid-cols-1 gap-3">

            {/* Identification */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Barcode className="h-4 w-4 text-stone-400" />
                <h3 className="text-sm font-bold text-stone-900">Identification</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Code-barres</p>
                  <p className="mt-1 font-mono text-xs text-stone-800 break-all">{product.barcode}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Marque</p>
                  <p className="mt-1 text-stone-700 text-xs">{product.brand || "Non renseignée"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Nom complet</p>
                  <p className="mt-1 font-semibold text-stone-800 text-xs">{product.name}</p>
                </div>
              </div>
            </div>

            {/* Tarifs */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Euro className="h-4 w-4 text-stone-400" />
                <h3 className="text-sm font-bold text-stone-900">Tarifs</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-stone-50 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Achat</p>
                  <p className="mt-1 text-xs font-bold text-stone-800">{formatPrice(product.purchasePrice)}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Vente</p>
                  <p className="mt-1 text-xs font-bold text-stone-800">{formatPrice(product.salesPrice)}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3 text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">Marge</p>
                  <p className={`mt-1 text-xs font-bold ${margin === null ? "text-stone-500" : margin >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {margin === null ? "—" : `${margin.toFixed(2)} EUR`}
                  </p>
                </div>
              </div>
            </div>

            {/* Suivi */}
            <div className="rounded-2xl border border-stone-200 bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Boxes className="h-4 w-4 text-stone-400" />
                <h3 className="text-sm font-bold text-stone-900">Suivi</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3">
                  <Tag className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Catégorie</p>
                    <p className="mt-0.5 text-xs text-stone-700">{product.category || "Non classé"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Variation récente</p>
                    <p className="mt-0.5 text-xs text-stone-700">
                      {typeof product.lastMovement === "number"
                        ? `${product.lastMovement > 0 ? "+" : ""}${product.lastMovement}`
                        : "Non renseignée"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3">
                  <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Dernière mise à jour</p>
                    <p className="mt-0.5 text-xs text-stone-700">{formatDate(product.lastUpdated)}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer actions */}
        <footer className="border-t border-stone-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3.5">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onEditStock}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition active:scale-[0.98] hover:bg-indigo-700 select-none cursor-pointer"
            >
              <ClipboardList className="h-4 w-4" />
              Ajuster stock
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-xs font-bold text-stone-700 hover:text-stone-900 hover:border-stone-300 transition active:scale-[0.98] select-none cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Modifier
            </button>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
