import { motion, AnimatePresence } from "motion/react";
import { Power, X } from "lucide-react";
import { quitApp } from "../lib/electronUtils";

type QuitConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function QuitConfirmModal({ isOpen, onClose }: QuitConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm rounded-3xl border border-stone-200/50 bg-white/95 backdrop-blur-xl p-6 shadow-2xl shadow-stone-900/10">
              {/* Close X */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Annuler"
                className="absolute top-4 right-4 p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200/50 flex items-center justify-center">
                  <Power className="h-7 w-7 text-red-500" />
                </div>
              </div>

              {/* Text */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-extrabold text-stone-900 mb-1.5">
                  Quitter l'application ?
                </h3>
                <p className="text-sm text-stone-500 font-medium leading-relaxed">
                  Êtes-vous sûr de vouloir fermer NeuroStock ?
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onClose}
                  className="flex-1 h-11 rounded-2xl border border-stone-200/60 bg-white text-sm font-bold text-stone-600 hover:bg-stone-50 transition cursor-pointer select-none"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => quitApp()}
                  className="flex-1 h-11 rounded-2xl bg-red-500 hover:bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition cursor-pointer select-none"
                >
                  <Power className="w-4 h-4" />
                  Quitter
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
