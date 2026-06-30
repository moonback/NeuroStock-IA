import React, { useMemo } from "react";
import { Package, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, BarChart3, ShoppingCart, Layers } from "lucide-react";
import { motion } from "motion/react";
import { InventoryItem, CategoryItem } from "../../types";

type DashboardTabProps = {
  inventory: InventoryItem[];
  dbCategories: CategoryItem[];
};

type CategoryStats = {
  name: string;
  count: number;
  qty: number;
  value: number;
  salesValue: number;
};

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} €`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "indigo" | "stone" | "emerald" | "amber" | "rose";
}) {
  const toneMap: Record<string, string> = {
    indigo: "bg-indigo-50 border-indigo-100 text-indigo-700",
    stone: "bg-white border-slate-200 text-slate-700",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    amber: "bg-amber-50 border-amber-100 text-amber-700",
    rose: "bg-rose-50 border-rose-100 text-rose-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${toneMap[tone]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</p>
          <p className="text-xl font-black tabular-nums">{typeof value === "number" ? value.toFixed(2) : value}</p>
        </div>
        <div className="h-10 w-10 rounded-xl bg-white/60 border border-white/80 flex items-center justify-center flex-shrink-0 shadow-xs">
          <Icon className="h-5 w-5 stroke-[2.5]" />
        </div>
      </div>
    </motion.div>
  );
}

function HorizontalBar({
  label,
  value,
  max,
  color,
  key,
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
        <span className="truncate pr-2">{label}</span>
        <span className="tabular-nums">{value}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%`, transformOrigin: "left" }}
        />
      </div>
    </div>
  );
}

export function DashboardTab({ inventory, dbCategories }: DashboardTabProps) {
  const stats = useMemo(() => {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockCount = inventory.filter((item) => item.quantity <= 5 && item.quantity > 0).length;
    const outOfStockCount = inventory.filter((item) => item.quantity === 0).length;
    const inStockCount = inventory.filter((item) => item.quantity > 5).length;

    const totalPurchaseVal = inventory.reduce((sum, item) => sum + item.quantity * (item.purchasePrice ?? 0), 0);
    const totalSalesVal = inventory.reduce((sum, item) => sum + item.quantity * (item.salesPrice ?? 0), 0);
    const potentialMargin = totalSalesVal - totalPurchaseVal;

    const topByQty = [...inventory].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const topByValue = [...inventory]
      .sort((a, b) => {
        const aVal = a.quantity * (a.purchasePrice ?? 0);
        const bVal = b.quantity * (b.purchasePrice ?? 0);
        return bVal - aVal;
      })
      .slice(0, 5);

    const categoryStatsList: CategoryStats[] = [];
    const categoryMap = new Map<string, CategoryStats>();
    inventory.forEach((item) => {
      const cat = item.category?.trim() || "Non classé";
      const entry = categoryMap.get(cat) || { name: cat, count: 0, qty: 0, value: 0, salesValue: 0 };
      entry.count += 1;
      entry.qty += item.quantity;
      entry.value += item.quantity * (item.purchasePrice ?? 0);
      entry.salesValue += item.quantity * (item.salesPrice ?? 0);
      categoryMap.set(cat, entry);
    });

    const categoryStats = Array.from(categoryMap.values())
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const recentlyScanned = [...inventory]
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, 6);

    return {
      totalItems,
      lowStockCount,
      outOfStockCount,
      inStockCount,
      totalPurchaseVal,
      totalSalesVal,
      potentialMargin,
      topByQty,
      topByValue,
      categoryStats,
      recentlyScanned,
    };
  }, [inventory]);

  const stockData = [
    { label: "En stock", value: stats.inStockCount, color: "bg-emerald-500" },
    { label: "Faible", value: stats.lowStockCount, color: "bg-amber-500" },
    { label: "Rupture", value: stats.outOfStockCount, color: "bg-rose-500" },
  ];
  const stockMax = Math.max(...stockData.map((d) => d.value), 1);

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <Package className="h-10 w-10 stroke-[1.5]" />
        <p className="text-sm font-semibold">Aucune donnée à afficher</p>
        <p className="text-xs">Commencez par scanner ou ajouter des produits.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Références" value={inventory.length} icon={Package} tone="indigo" />
        <StatCard label="Unités" value={stats.totalItems} icon={Layers} tone="stone" />
        <StatCard label="Achats" value={formatCurrency(stats.totalPurchaseVal)} icon={ShoppingCart} tone="amber" />
        <StatCard label="CA Potentiel" value={formatCurrency(stats.totalSalesVal)} icon={TrendingUp} tone="emerald" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard label="Marge Est." value={formatCurrency(stats.potentialMargin)} icon={BarChart3} tone={stats.potentialMargin >= 0 ? "emerald" : "rose"} />

        {/* Stock state mini summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">État du stock</p>
          <div className="space-y-2">
            {stockData.map((d) => (
              <div key={d.label} className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${d.color}`} />
                  {d.label}
                </span>
                <span className="tabular-nums">{d.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 overflow-hidden flex">
            {stockData.map((d) => (
              <motion.div
                key={d.label}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5 }}
                className={`h-full ${d.color}`}
                style={{ width: `${(d.value / stockMax) * 100}%` }}
              />
            ))}
          </div>
        </motion.div>

        {/* Alert summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
        >
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Alertes</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-rose-600">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Ruptures
              </span>
              <span className="tabular-nums">{stats.outOfStockCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-amber-600">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Stock faible
              </span>
              <span className="tabular-nums">{stats.lowStockCount}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Top 5 par quantité et valeur */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top 5 quantité</p>
            <ArrowUpRight className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {stats.topByQty.map((item) => (
              <HorizontalBar key={item.barcode} label={`${item.name}${item.category ? ` · ${item.category}` : ""}`} value={item.quantity} max={stats.topByQty[0]?.quantity || 1} color="bg-indigo-500" />
            ))}
            {stats.topByQty.length === 0 && <p className="text-xs text-slate-400">Aucune donnée</p>}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Top 5 valeur d'achat</p>
            <ArrowDownRight className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            {stats.topByValue.map((item) => {
              const itemVal = item.quantity * (item.purchasePrice ?? 0);
              const maxVal = (stats.topByValue[0]?.quantity ?? 0) * (stats.topByValue[0]?.purchasePrice ?? 0) || 1;
              return (
                <HorizontalBar key={item.barcode} label={`${item.name}${item.category ? ` · ${item.category}` : ""}`} value={itemVal} max={maxVal} color="bg-emerald-500" />
              );
            })}
            {stats.topByValue.length === 0 && <p className="text-xs text-slate-400">Aucune donnée</p>}
          </div>
        </motion.div>
      </div>

      {/* Répartition par catégorie */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Répartition par catégorie</p>
          <ShoppingCart className="h-4 w-4 text-slate-400" />
        </div>
        {stats.categoryStats.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-3">
              {stats.categoryStats.slice(0, 6).map((cat) => {
                const maxCount = Math.max(...stats.categoryStats.map((c) => c.count), 1);
                return (
                  <div key={cat.name} className="flex items-center justify-between text-xs font-bold text-slate-600 gap-2">
                    <span className="truncate flex-1">{cat.name}</span>
                    <div className="flex-1 max-w-[120px]">
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.5 }}
                          className="h-2 rounded-full bg-indigo-500"
                          style={{ width: `${(cat.count / maxCount) * 100}%`, transformOrigin: "left" }}
                        />
                      </div>
                    </div>
                    <span className="tabular-nums w-8 text-right">{cat.count}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-2">
              {stats.categoryStats.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span className="truncate flex-1">{cat.name}</span>
                  <span className="tabular-nums w-16 text-right">{formatCurrency(cat.value)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400">Aucune catégorie renseignée.</p>
        )}
      </motion.div>

      {/* Derniers scans */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-100 bg-white p-4 shadow-xs"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Derniers produits scannés / modifiés</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
          {stats.recentlyScanned.map((item) => {
            const itemValue = item.quantity * (item.purchasePrice ?? 0);
            return (
              <div key={item.barcode} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-800 truncate">{item.name}</p>
                  <p className="text-[10px] font-semibold text-slate-400 truncate">{item.barcode}</p>
                </div>
                <div className="text-right ml-2">
                  <p className="text-xs font-black tabular-nums text-slate-800">{item.quantity} u.</p>
                  {itemValue > 0 && <p className="text-[10px] font-bold tabular-nums text-slate-500">{itemValue.toFixed(2)} €</p>}
                </div>
              </div>
            );
          })}
          {stats.recentlyScanned.length === 0 && <p className="text-xs text-slate-400">Aucune activité récente.</p>}
        </div>
      </motion.div>
    </div>
  );
}
