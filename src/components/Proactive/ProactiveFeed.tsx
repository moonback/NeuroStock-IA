import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ProactiveSignalCard } from "./ProactiveSignalCard";
import { Inbox, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { ProactiveSignal } from '../../types';
import { cn } from "../../lib/utils";

type ProactiveFeedProps = {
  signals: ProactiveSignal[];
  onAcknowledge?: (id: string) => void;
  onAction?: (id: string) => void;
};

export type { ProactiveFeedProps };

type Filter = "all" | "pending" | "acknowledged";

const FILTER_CONFIG: Record<Filter, { label: string; Icon: React.ElementType }> = {
  all: { label: "Tout", Icon: Info },
  pending: { label: "À traiter", Icon: AlertTriangle },
  acknowledged: { label: "Terminé", Icon: CheckCircle2 },
};

export function ProactiveFeed({
  signals,
  onAcknowledge,
  onAction,
}: ProactiveFeedProps) {
  const [filter, setFilter] = React.useState<Filter>("all");

  const filtered = React.useMemo(() => {
    if (filter === "pending") return signals.filter((s) => !s.acknowledged);
    if (filter === "acknowledged") return signals.filter((s) => s.acknowledged);
    return signals;
  }, [signals, filter]);

  const pendingCount = signals.filter((s) => !s.acknowledged).length;
  const acknowledgedCount = signals.filter((s) => s.acknowledged).length;

  return (
    <section className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-2">
        {(Object.keys(FILTER_CONFIG) as Filter[]).map((key) => {
          const { label, Icon } = FILTER_CONFIG[key];
          const isActive = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "touch-target inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5",
                "text-xs font-bold tracking-wide transition-all duration-200",
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-white text-stone-500 border border-neutral-100 hover:border-indigo-200 hover:text-indigo-600"
              )}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {label}
              {key === "pending" && pendingCount > 0 && (
                <span className="ml-0.5 rounded-full bg-indigo-600/20 px-1.5 py-0.5 text-[10px] font-mono">
                  {pendingCount}
                </span>
              )}
              {key === "acknowledged" && acknowledgedCount > 0 && (
                <span className="ml-0.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono text-stone-500">
                  {acknowledgedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-white p-8 text-center"
            >
              <div className="rounded-2xl bg-neutral-50 p-3">
                <Inbox className="h-6 w-6 text-neutral-400" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink">Aucun signal</p>
                <p className="text-xs text-stone-400">
                  Tous les indicateurs sont à jour pour le moment.
                </p>
              </div>
            </motion.div>
          ) : (
            filtered.map((signal) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProactiveSignalCard
                  signal={signal}
                  onAcknowledge={onAcknowledge}
                  onAction={onAction}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
