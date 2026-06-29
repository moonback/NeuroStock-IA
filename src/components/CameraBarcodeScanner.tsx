import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, Flashlight, FlashlightOff, Loader2, ScanLine, ShieldAlert, X } from "lucide-react";

const BARCODE_FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
  "qr_code",
] as const;

const ZXING_CDN_URL = "https://esm.sh/@zxing/browser@0.1.5";

type BarcodeDetectorConstructor = new (options?: { formats?: readonly string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type BrowserMultiFormatReader = {
  decodeFromVideoElement: (
    videoElement: HTMLVideoElement,
    callback: (result?: { getText: () => string }, error?: unknown) => void,
  ) => Promise<{ stop: () => void }>;
};

type ZxingBrowserModule = {
  BrowserMultiFormatReader: new () => BrowserMultiFormatReader;
};

type ScannerEngine = "native" | "zxing" | null;

interface CameraBarcodeScannerProps {
  enabled: boolean;
  isBusy: boolean;
  onScan: (barcode: string) => void;
}

function getNativeBarcodeDetector(): BarcodeDetectorConstructor | null {
  const detector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  return detector ?? null;
}

async function loadZxingReader() {
  const zxing = (await import(/* @vite-ignore */ ZXING_CDN_URL)) as ZxingBrowserModule;
  return new zxing.BrowserMultiFormatReader();
}

export function CameraBarcodeScanner({ enabled, isBusy, onScan }: CameraBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingControlsRef = useRef<{ stop: () => void } | null>(null);
  const scanLockRef = useRef(false);
  const startLockRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<ScannerEngine>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [isCameraPickerOpen, setIsCameraPickerOpen] = useState(false);

  const canScan = enabled && !isBusy;

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    scanLockRef.current = false;
    startLockRef.current = false;
    setIsOpen(false);
    setIsStarting(false);
    setTorchSupported(false);
    setTorchEnabled(false);
    setEngine(null);
    setIsCameraPickerOpen(false);
  }, []);


  const refreshVideoInputs = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return [];

    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    setVideoInputs(cameras);
    return cameras;
  }, []);

  const emitScan = useCallback(
    (rawCode?: string) => {
      const code = rawCode?.trim();
      if (!code || scanLockRef.current || isBusy) return;

      scanLockRef.current = true;
      setStatus(`Code détecté : ${code}`);
      onScan(code);
      window.setTimeout(() => {
        scanLockRef.current = false;
      }, 1200);
    },
    [isBusy, onScan],
  );

  const detectWithNativeApi = useCallback(
    (detector: InstanceType<BarcodeDetectorConstructor>) => {
      const tick = async () => {
        const video = videoRef.current;
        if (!video || !streamRef.current) return;

        if (!scanLockRef.current && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          try {
            const codes = await detector.detect(video);
            emitScan(codes[0]?.rawValue);
          } catch (detectError) {
            console.error("Erreur BarcodeDetector:", detectError);
          }
        }
        animationFrameRef.current = requestAnimationFrame(tick);
      };
      animationFrameRef.current = requestAnimationFrame(tick);
    },
    [emitScan],
  );

  const startCamera = useCallback(async (cameraId = selectedCameraId, forceRestart = false) => {
    if (!canScan || startLockRef.current || (streamRef.current && !forceRestart)) return;

    if (forceRestart && streamRef.current) {
      stopCamera();
    }

    startLockRef.current = true;
    setIsStarting(true);
    setError(null);
    setStatus("Demande d’autorisation caméra...");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("La caméra n’est pas disponible sur ce navigateur.");
      }

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        ...(cameraId
          ? { deviceId: { exact: cameraId } }
          : { facingMode: { ideal: "environment" } }),
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        throw new Error("Élément vidéo indisponible pour démarrer le scan caméra.");
      }
      video.srcObject = stream;

      const [track] = stream.getVideoTracks();
      const activeCameraId = track?.getSettings().deviceId ?? cameraId ?? null;
      if (activeCameraId) setSelectedCameraId(activeCameraId);
      await refreshVideoInputs();

      const capabilities = track?.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
      setTorchSupported(Boolean(capabilities?.torch));
      setIsOpen(true);

      const BarcodeDetector = getNativeBarcodeDetector();
      if (BarcodeDetector) {
        await video.play();
        setEngine("native");
        setStatus("Scan caméra actif via BarcodeDetector.");
        detectWithNativeApi(new BarcodeDetector({ formats: BARCODE_FORMATS }));
      } else {
        setEngine("zxing");
        setStatus("BarcodeDetector indisponible : chargement du fallback ZXing...");
        const reader = await loadZxingReader();
        zxingControlsRef.current = await reader.decodeFromVideoElement(video, (result) => {
          emitScan(result?.getText());
        });
        setStatus("Scan caméra actif via fallback ZXing.");
      }
    } catch (startError) {
      console.error("Erreur d’accès caméra:", startError);
      stopCamera();
      setError(
        startError instanceof Error
          ? startError.message
          : "Impossible d’activer la caméra. Vérifiez les permissions du navigateur.",
      );
    } finally {
      startLockRef.current = false;
      setIsStarting(false);
    }
  }, [canScan, detectWithNativeApi, emitScan, refreshVideoInputs, selectedCameraId, stopCamera]);


  const handleCameraSelection = useCallback(
    (cameraId: string) => {
      if (cameraId === selectedCameraId && isOpen) {
        setIsCameraPickerOpen(false);
        return;
      }

      setSelectedCameraId(cameraId);
      setIsCameraPickerOpen(false);
      if (isOpen) {
        stopCamera();
        void startCamera(cameraId, true);
      }
    },
    [isOpen, selectedCameraId, startCamera, stopCamera],
  );

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;

    const nextTorchState = !torchEnabled;
    try {
      await track.applyConstraints({ advanced: [{ torch: nextTorchState } as MediaTrackConstraintSet] });
      setTorchEnabled(nextTorchState);
    } catch (torchError) {
      console.error("Erreur torche:", torchError);
      setError("La torche n’a pas pu être activée sur cet appareil.");
    }
  }, [torchEnabled, torchSupported]);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    if (!canScan && isOpen) stopCamera();
  }, [canScan, isOpen, stopCamera]);

  const selectedCamera = useMemo(
    () => videoInputs.find((device) => device.deviceId === selectedCameraId),
    [selectedCameraId, videoInputs],
  );

  const selectedCameraLabel = selectedCamera?.label || "Caméra active";

  const engineLabel = useMemo(() => {
    if (engine === "native") return "BarcodeDetector";
    if (engine === "zxing") return "Fallback ZXing";
    return "Prêt";
  }, [engine]);

  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/60 bg-white shadow-sm">

      {/* ── Camera viewport ── */}
      <div className="relative bg-stone-950" style={{ aspectRatio: '4/3' }}>
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

        {/* Idle placeholder */}
        {!isOpen && !isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-stone-900">
            {/* Corner guides */}
            <div className="relative h-36 w-52">
              <span className="absolute top-0 left-0 h-7 w-7 border-t-2 border-l-2 border-indigo-400 rounded-tl-md" />
              <span className="absolute top-0 right-0 h-7 w-7 border-t-2 border-r-2 border-indigo-400 rounded-tr-md" />
              <span className="absolute bottom-0 left-0 h-7 w-7 border-b-2 border-l-2 border-indigo-400 rounded-bl-md" />
              <span className="absolute bottom-0 right-0 h-7 w-7 border-b-2 border-r-2 border-indigo-400 rounded-br-md" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-white">
                <Camera className="h-6 w-6 text-stone-500" />
                <p className="text-[11px] font-bold text-stone-300">Caméra désactivée</p>
              </div>
            </div>
            {/* Start button inside viewport */}
            <button
              type="button"
              onClick={() => void startCamera()}
              disabled={!canScan}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 transition active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer hover:bg-indigo-500"
            >
              <Camera className="h-4 w-4" />
              Démarrer le scan
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {isStarting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-stone-900/90 text-white backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
            <p className="text-xs font-bold text-stone-300">Activation caméra…</p>
          </div>
        )}

        {/* Active scan overlay with animated corners + sweep line */}
        {isOpen && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            {/* Dim surround */}
            <div className="absolute inset-0 bg-stone-950/40" />
            {/* Scan frame */}
            <div className="relative z-10 h-36 w-64">
              {/* Corners */}
              <span className="absolute top-0 left-0 h-6 w-6 border-t-[3px] border-l-[3px] border-white rounded-tl-md" />
              <span className="absolute top-0 right-0 h-6 w-6 border-t-[3px] border-r-[3px] border-white rounded-tr-md" />
              <span className="absolute bottom-0 left-0 h-6 w-6 border-b-[3px] border-l-[3px] border-white rounded-bl-md" />
              <span className="absolute bottom-0 right-0 h-6 w-6 border-b-[3px] border-r-[3px] border-white rounded-br-md" />
              {/* Sweep line */}
              <span className="absolute inset-x-2 top-1/2 h-[2px] -translate-y-1/2 animate-scan-line rounded-full bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
            </div>
          </div>
        )}

        {/* Top-right status badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold backdrop-blur-sm ${
            isOpen
              ? 'bg-emerald-900/70 text-emerald-300'
              : 'bg-stone-900/60 text-stone-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-stone-500'
            }`} />
            {engineLabel}
          </span>
        </div>

        {/* Torch button overlay (only if active + supported) */}
        {isOpen && torchSupported && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`absolute bottom-2.5 right-2.5 grid h-9 w-9 place-items-center rounded-xl transition active:scale-95 cursor-pointer ${
              torchEnabled
                ? 'bg-amber-400/90 text-stone-900'
                : 'bg-stone-900/60 text-white backdrop-blur-sm hover:bg-stone-800/80'
            }`}
            aria-label={torchEnabled ? 'Désactiver la torche' : 'Activer la torche'}
          >
            {torchEnabled ? <FlashlightOff className="h-4 w-4" /> : <Flashlight className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* ── Info bar ── */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-400">
          <Camera className="h-3 w-3" />
          Caméra mobile
        </span>
        {isOpen && (
          <span className="text-[10px] font-medium text-stone-400 truncate max-w-[60%] text-right">
            {selectedCameraLabel}
          </span>
        )}
      </div>

      {/* ── Controls (visible only when camera is open) ── */}
      {isOpen && (
        <div className="flex gap-2 px-4 py-3">
          <button
            type="button"
            onClick={stopCamera}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-bold transition active:scale-[0.98] select-none cursor-pointer bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100"
          >
            <CameraOff className="h-4 w-4" />
            Arrêter
          </button>
          {videoInputs.length > 1 && (
            <button
              type="button"
              onClick={() => setIsCameraPickerOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-stone-200/80 bg-white text-stone-500 transition hover:text-stone-900 active:scale-95 cursor-pointer"
              aria-label={`Choisir la caméra. Caméra actuelle : ${selectedCameraLabel}`}
            >
              <Camera className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Status / error banner ── */}
      {(status || error) && (
        <div className={`mx-4 mb-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[11px] font-semibold ${
          error
            ? 'border-rose-200 bg-rose-50 text-rose-600'
            : 'border-indigo-100 bg-indigo-50/60 text-indigo-700'
        }`}>
          {error && <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span>{error || status}</span>
        </div>
      )}

      {/* ── Camera picker sheet ── */}
      {isCameraPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-t-2xl border-t border-stone-200/60 bg-white px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="h-1 w-10 rounded-full bg-stone-200" />
            </div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-extrabold text-stone-900">Choisir une caméra</p>
                <p className="mt-0.5 text-[11px] font-medium text-stone-400">Active : {selectedCameraLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCameraPickerOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-stone-200/80 bg-white text-stone-400 transition hover:text-stone-900 active:scale-95 cursor-pointer"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {videoInputs.map((device, index) => (
                <button
                  key={device.deviceId || `camera-${index}`}
                  type="button"
                  onClick={() => handleCameraSelection(device.deviceId)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left text-xs font-bold transition cursor-pointer select-none ${
                    device.deviceId === selectedCameraId
                      ? 'border-indigo-200/80 bg-indigo-50/70 text-indigo-800'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <span>{device.label || `Caméra ${index + 1}`}</span>
                  {device.deviceId === selectedCameraId && (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-700">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
