import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

type ConfirmVariant = "danger" | "warning" | "info";

const VARIANT_CLASSES: Record<ConfirmVariant, { icon: string; btn: string }> = {
  danger: {
    icon: "bg-rose-50 border-rose-200 text-rose-500",
    btn: "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20",
  },
  warning: {
    icon: "bg-amber-50 border-amber-200 text-amber-600",
    btn: "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20",
  },
  info: {
    icon: "bg-indigo-50 border-indigo-200 text-indigo-600",
    btn: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20",
  },
};

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isRunning?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  isRunning = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={isRunning ? undefined : onCancel}
            className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
          >
            <div className="relative w-full max-w-sm rounded-t-[2rem] sm:rounded-[2rem] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-6 shadow-2xl shadow-slate-900/10 max-h-[92vh] overflow-y-auto no-scrollbar">
              {/* Close */}
              <button
                type="button"
                onClick={isRunning ? undefined : onCancel}
                disabled={isRunning}
                aria-label="Fermer"
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Text */}
              <div className="text-center mb-6">
                <h3
                  id="confirm-modal-title"
                  className="text-base font-extrabold text-slate-900 leading-snug"
                >
                  {title}
                </h3>
                <p
                  id="confirm-modal-desc"
                  className="text-xs text-slate-500 font-medium leading-relaxed mt-1.5"
                >
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onCancel}
                  disabled={isRunning}
                  className="flex-1 h-11 rounded-2xl border border-slate-200/80 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer select-none disabled:opacity-40"
                >
                  {cancelLabel}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onConfirm}
                  disabled={isRunning}
                  className={`flex-1 h-11 rounded-2xl text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer select-none disabled:opacity-40 ${VARIANT_CLASSES[variant].btn}`}
                >
                  {confirmLabel}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
