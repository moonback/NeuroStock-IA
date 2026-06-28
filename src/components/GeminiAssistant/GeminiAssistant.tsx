import { useCallback, useEffect, useMemo, useState } from "react";
import type { AssistantState } from "./types";
import { FloatingBubble } from "./FloatingBubble";
import { GeminiDrawer } from "./GeminiDrawer";
import { PermissionDialog } from "./PermissionDialog";
import { FunctionDispatcher } from "./FunctionDispatcher";
import { LiveSession } from "./LiveSession";
import { buildSystemPrompt } from "./systemPrompt";
import type { InventoryContextSnapshot } from "./typesInternal";

export function GeminiAssistant(props: {
  apiKey: string;
  inventorySnapshot: InventoryContextSnapshot;
  connectedState: string;
  minimizedByDefault?: boolean;
  toolHandlers: {
    updateStock: (args: { barcode: string; quantity: number }) => Promise<void | { queued?: boolean }>;
    exportCSV: () => void;
  };
}) {
  const {
    apiKey,
    inventorySnapshot,
    connectedState,
    minimizedByDefault = true,
    toolHandlers,
  } = props;

  const [state, setState] = useState<AssistantState>("Idle");
  const [minimized, setMinimized] = useState(minimizedByDefault);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCfg, setConfirmCfg] = useState({
    title: "Confirmation",
    detail: "",
    confirmLabel: "Oui",
    cancelLabel: "Non",
  });

  const [confirmResolver, setConfirmResolver] = useState<((v: boolean) => void) | null>(null);

  const showConfirmation = useCallback(
    (p: { title: string; detail?: string; confirmLabel?: string; cancelLabel?: string }) => {
      setConfirmCfg({
        title: p.title,
        detail: p.detail ?? "",
        confirmLabel: p.confirmLabel ?? "Oui",
        cancelLabel: p.cancelLabel ?? "Non",
      });
      setConfirmOpen(true);
      return new Promise<boolean>((resolve) => {
        setConfirmResolver(() => resolve);
      });
    },
    [],
  );

  const confirmCtx = useMemo(() => ({ showConfirmation }), [showConfirmation]);

  const dispatcher = useMemo(() => {
    return new FunctionDispatcher(toolHandlers as any, confirmCtx as any);
  }, [toolHandlers, confirmCtx]);

  const systemPrompt = useMemo(() => {
    return buildSystemPrompt({
      ...inventorySnapshot,
      connectedState,
      language: "fr",
    });
  }, [inventorySnapshot, connectedState]);

  const sessionRef = useMemo(() => {
    return new LiveSession(
      {
        apiKey,
        model: "gemini-3.1-flash-live-preview",
        responseModalities: ["AUDIO"],
      },
      {
        onState: setState,
        onError: (e) => {
          setState("Error");
          console.error(e);
        },
      },
      {
        dispatcher,
        systemPrompt,
      },
    );
  }, [apiKey, dispatcher, systemPrompt]);

  useEffect(() => {
    // Always connect in background when provider mounts.
    let mounted = true;
    (async () => {
      try {
        await sessionRef.connect();
        if (!mounted) return;
        // do not auto start listening; only after user taps micro.
      } catch (e) {
        setState("Error");
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [sessionRef]);

  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 });

  const open = useCallback(async () => {
    setMinimized(false);
    if (state === "Idle" || state === "Connecting") {
      try {
        await sessionRef.startListening();
      } catch (e) {
        setState("Error");
        console.error(e);
      }
    }
  }, [sessionRef, state]);

  const close = useCallback(async () => {
    setMinimized(true);
    try {
      await sessionRef.close();
    } catch {
      // ignore
    }
    setState("Idle");
  }, [sessionRef]);

  const toggleMute = useCallback(async () => {
    if (state === "Muted") {
      try {
        await sessionRef.startListening();
        setState("Listening");
      } catch (e) {
        setState("Error");
        console.error(e);
      }
    } else {
      try {
        await sessionRef.mute(true);
      } catch {
        // ignore
      }
      setState("Muted");
    }
  }, [sessionRef, state]);

  const minimize = useCallback(() => setMinimized(true), []);

  return (
    <>
      <FloatingBubble
        minimized={minimized}
        state={state}
        position={bubblePos}
        onClick={open}
        onDragStart={() => void 0}
        onDrag={(x, y) => setBubblePos({ x, y })}
        onDragEnd={() => void 0}
      />

      <div className="fixed z-40 bottom-24 right-4 sm:hidden">
        {/* When not minimized, bubble is hidden; show drawer controlled UI */}
        {!minimized && (
          <button className="tap-active bg-indigo-600 text-white rounded-full px-4 py-3 shadow-lg" onClick={() => setMinimized(false)}>
            🎤
          </button>
        )}
      </div>

      <GeminiDrawer
        minimized={minimized}
        state={state}
        onMinimize={minimize}
        onClose={close}
        onToggleMute={toggleMute}
      />

      <PermissionDialog
        open={confirmOpen}
        title={confirmCfg.title}
        detail={confirmCfg.detail}
        confirmLabel={confirmCfg.confirmLabel}
        cancelLabel={confirmCfg.cancelLabel}
        onCancel={() => {
          setConfirmOpen(false);
          confirmResolver?.(false);
          setConfirmResolver(null);
        }}
        onConfirm={() => {
          setConfirmOpen(false);
          confirmResolver?.(true);
          setConfirmResolver(null);
        }}
      />
    </>
  );
}

