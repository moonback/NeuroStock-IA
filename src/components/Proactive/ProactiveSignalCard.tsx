import React from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  PackageX,
  Clock,
  FolderOpen,
  TrendingDown,
  CheckCircle2,
  MoreVertical,
} from "lucide-react";
import type { ProactiveSignal } from '../../types';
import { cn } from "../../lib/utils";
import { formatRelativeTime } from "../../lib/utils";

type ProactiveSignalCardProps = {
  signal: ProactiveSignal;
  onAcknowledge?: (id: string) => void;
  onAction?: (id: string) => void;
};

export type { ProactiveSignalCardProps };

const TYPE_CONFIG: Record<
  ProactiveSignal["type"],
  { icon: React.ElementType; badge: string; indicator: string }
> = {
  low_stock: {
    icon: PackageX,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    indicator: "bg-amber-500",
  },
  out_of_stock: {
    icon: AlertCircle,
    badge: "bg-red-50 text-red-700 border-red-200",
    indicator: "bg-red-500",
  },
  dormant_stock: {
    icon: Clock,
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    indicator: "bg-slate-500",
  },
  category_empty: {
    icon: FolderOpen,
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    indicator: "bg-indigo-500",
  },
  low_margin: {
    icon: TrendingDown,
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    indicator: "bg-orange-500",
  },
};

const SEVERITY_LABEL: Record<ProactiveSignal["severity"], string> = {
  info: "Information",
  warning: "Attention",
  critical: "Critique",
};

export function ProactiveSignalCard({
  signal,
  onAcknowledge,
  onAction,
}: ProactiveSignalCardProps) {
  const config = TYPE_CONFIG[signal.type] ?? TYPE_CONFIG.low_stock;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex items-stretch gap-3 bg-white",
        "border border-neutral-100/80 rounded-2xl p-3.5",
        "shadow-sm shadow-neutral-200/50",
        "hover:shadow-md hover:shadow-neutral-200/80 transition-shadow duration-200"
      )}
    >
      {/* Severity indicator */}
      <div
        className={cn(
          "flex-shrink-0 w-1 rounded-xl",
          config.indicator
        )}
      />

      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 h-10 w-10 rounded-xl border grid place-items-center",
          config.badge
        )}
      >
        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className="text-sm font-semibold text-ink leading-snug line-clamp-2">
          {signal.message}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="inline-block text-[11px] font-medium text-stone-400 font-mono tabular">
            {formatRelativeTime(signal.timestamp)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-300">
            {SEVERITY_LABEL[signal.severity]}
          </span>
        </div>
      </div>

      {/* Actions */}
      {(onAcknowledge || onAction) && (
        <div className="flex flex-col justify-center gap-1.5">
          {!signal.acknowledged && onAcknowledge && (
            <button
              onClick={() => onAcknowledge(signal.id)}
              className={cn(
                "touch-target flex items-center justify-center rounded-lg p-1.5",
                "text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              )}
              aria-label="Marquer comme lu"
            >
              <CheckCircle2 className="h-4 w-4" />
            </button>
          )}
          {onAction && (
            <button
              onClick={() => onAction(signal.id)}
              className={cn(
                "touch-target flex items-center justify-center rounded-lg p-1.5",
                "text-stone-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              )}
              aria-label="Plus d'actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
