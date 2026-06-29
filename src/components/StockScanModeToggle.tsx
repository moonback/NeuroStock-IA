import { Minus, Plus, ScanLine } from "lucide-react";

export type StockScanMode = "add" | "remove";

interface StockScanModeToggleProps {
  enabled: boolean;
  mode: StockScanMode;
  onEnabledChange: (enabled: boolean) => void;
  onModeChange: (mode: StockScanMode) => void;
}

export function StockScanModeToggle({
  enabled,
  mode,
  onEnabledChange,
  onModeChange,
}: StockScanModeToggleProps) {
  return (
    <div className="mb-3 rounded-2xl border border-stone-200/60 bg-white p-3 shadow-sm sm:mb-4 sm:p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-stone-900">Scan automatique</h3>
          </div>
          <p className="mt-0.5 text-[10px] text-stone-500">
            Chaque scan {mode === "add" ? "ajoute" : "retire"} 1 unité sans fenêtre.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEnabledChange(!enabled)}
          className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
            enabled ? "bg-indigo-600" : "bg-stone-300"
          }`}
          role="switch"
          aria-checked={enabled}
          aria-label="Activer le scan automatique"
        >
          <span
            className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              enabled ? "translate-x-6" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="mt-3 grid grid-cols-2 gap-1.5 rounded-xl border border-stone-200/60 bg-stone-50/50 p-1">
          <button
            type="button"
            onClick={() => onModeChange("add")}
            className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition select-none cursor-pointer ${
              mode === "add"
                ? "bg-white text-emerald-700 border border-emerald-200/80 shadow-xs"
                : "text-stone-400 hover:bg-white/70 hover:text-stone-700"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Ajouter
          </button>
          <button
            type="button"
            onClick={() => onModeChange("remove")}
            className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-bold transition select-none cursor-pointer ${
              mode === "remove"
                ? "bg-white text-rose-600 border border-rose-200/80 shadow-xs"
                : "text-stone-400 hover:bg-white/70 hover:text-stone-700"
            }`}
          >
            <Minus className="h-3.5 w-3.5" />
            Retirer
          </button>
        </div>
      )}
    </div>
  );
}
