
import { Loader2, ScanLine, Zap } from "lucide-react";
import { ManualInput } from "./ManualInput";
import { CameraBarcodeScanner } from "./CameraBarcodeScanner";
import { StockScanModeToggle, StockScanMode } from "./StockScanModeToggle";
import { ScannerInputMode, ScannerInputModeToggle } from "./ScannerInputModeToggle";

interface AutomaticScanPanelProps {
  enabled: boolean;
  mode: StockScanMode;
  loadingBarcode: string | null;
  isOnline: boolean;
  pendingCount: number;
  syncError: string | null;
  onEnabledChange: (enabled: boolean) => void;
  onModeChange: (mode: StockScanMode) => void;
  scannerInputMode: ScannerInputMode;
  onScannerInputModeChange: (mode: ScannerInputMode) => void;
  onScan: (barcode: string) => void;
}

export function AutomaticScanPanel({
  enabled,
  mode,
  loadingBarcode,
  isOnline,
  pendingCount,
  syncError,
  onEnabledChange,
  onModeChange,
  scannerInputMode,
  onScannerInputModeChange,
  onScan,
}: AutomaticScanPanelProps) {
  return (
    <section className="space-y-3">
      {/* Scan header card */}
      <div className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/15">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold tracking-tight text-stone-900 leading-tight">
                Scan Auto
              </h2>
              <p className="mt-0.5 text-[10px] font-bold text-stone-400 leading-none">
                {!isOnline
                  ? "Hors-ligne"
                  : pendingCount > 0
                  ? `${pendingCount} modification${pendingCount > 1 ? "s" : ""} en attente`
                  : syncError
                  ? "Erreur de synchronisation"
                  : "Synchronisé"}
              </p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
            !isOnline
              ? "bg-stone-100 text-stone-500"
              : pendingCount > 0
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : syncError
              ? "bg-rose-50 text-rose-600 border border-rose-200"
              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              !isOnline ? "bg-stone-400" : pendingCount > 0 ? "bg-amber-500 animate-pulse" : syncError ? "bg-rose-500" : "bg-emerald-500"
            }`} />
            {!isOnline ? "Hors-ligne" : pendingCount > 0 ? `${pendingCount} en attente` : syncError ? "Erreur" : "Synchro On"}
          </span>
        </div>
      </div>

      <StockScanModeToggle
        enabled={enabled}
        mode={mode}
        onEnabledChange={onEnabledChange}
        onModeChange={onModeChange}
      />

      {enabled && (
        <>
          <ScannerInputModeToggle
            mode={scannerInputMode}
            onModeChange={onScannerInputModeChange}
            disabled={!!loadingBarcode}
          />

          <div className="relative">
            {loadingBarcode && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white/95 text-stone-700 backdrop-blur-xs">
                <Loader2 className="mb-2 h-6 w-6 animate-spin text-indigo-600" />
                <span className="font-mono text-xs font-semibold tracking-wider">
                  Scan {loadingBarcode}...
                </span>
              </div>
            )}
            {scannerInputMode === "hardware" ? (
              <ManualInput onScan={onScan} isActive={!loadingBarcode} />
            ) : (
              <CameraBarcodeScanner
                enabled={!loadingBarcode}
                isBusy={!!loadingBarcode}
                onScan={onScan}
              />
            )}
          </div>
        </>
      )}

      {!enabled && (
        <div className="flex items-start gap-2.5 rounded-xl border border-stone-200/60 bg-stone-50/60 px-3.5 py-3 text-[11px] font-medium text-stone-500">
          <ScanLine className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-stone-400" />
          Activez le scan automatique pour appliquer les mouvements sans fenêtre de confirmation.
        </div>
      )}
    </section>
  );
}
