import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Loader as Loader2 } from 'lucide-react';
import { AssistantState, AssistantContext, FunctionCallRequest } from './types';
import { LiveSession } from './LiveSession';
import { AudioManager } from './AudioManager';
import { FunctionDispatcher, DialogResult } from './FunctionDispatcher';
import { GeminiDrawer } from './GeminiDrawer';
import { FloatingBubble } from './FloatingBubble';
import { PermissionDialog } from './PermissionDialog';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface GeminiAssistantProps {
  context: AssistantContext;
  onExportCSV?: () => void;
  onRefresh?: () => Promise<void>;
}

export function GeminiAssistant({
  context,
  onExportCSV,
  onRefresh,
}: GeminiAssistantProps) {
  const [state, setState] = useState<AssistantState>(AssistantState.Idle);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPermission, setPendingPermission] = useState<{
    toolName: string;
    description: string;
    args: Record<string, unknown>;
    resolve: (result: DialogResult) => void;
  } | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  const dispatcherRef = useRef<FunctionDispatcher | null>(null);
  const audioChunkIntervalRef = useRef<number | null>(null);

  const isConnected = sessionRef.current?.isConnected() ?? false;

  const initializeComponents = useCallback(() => {
    if (!sessionRef.current) {
      sessionRef.current = new LiveSession();
    }

    if (!audioManagerRef.current) {
      audioManagerRef.current = AudioManager.getInstance();
    }

    if (!dispatcherRef.current) {
      dispatcherRef.current = new FunctionDispatcher();
    }
  }, []);

  const openPermissionDialog = useCallback(
    (
      toolName: string,
      description: string,
      args: Record<string, unknown>,
    ): Promise<DialogResult> => {
      return new Promise((resolve) => {
        setPendingPermission({
          toolName,
          description,
          args,
          resolve,
        });
      });
    },
    [],
  );

  const handleFunctionCall = useCallback(
    async (call: FunctionCallRequest, isDestructive: boolean): Promise<unknown> => {
      if (!dispatcherRef.current) {
        throw new Error('Dispatcher non initialisé');
      }

      dispatcherRef.current.setContext({
        inventory: context.inventory.items,
        categories: context.inventory.categories,
        onExportCSV: onExportCSV ?? (() => {}),
        openDialog: openPermissionDialog,
      });

      if (isDestructive) {
        const result = await openPermissionDialog(
          call.name,
          `Action destructive: ${call.name}`,
          call.args,
        );

        if (result.cancelled || !result.confirmed) {
          return {
            cancelled: true,
            message: 'Action annulée par l\'utilisateur',
          };
        }
      }

      const result = await dispatcherRef.current.dispatch(call);

      if (onRefresh && (call.name.includes('Stock') || call.name.includes('Category') || call.name === 'deleteProduct')) {
        await onRefresh();
      }

      return result;
    },
    [context.inventory, openPermissionDialog, onExportCSV, onRefresh],
  );

  const handleConnect = useCallback(async () => {
    if (!GEMINI_API_KEY) {
      setError('Clé API Gemini non configurée');
      setState(AssistantState.Error);
      return;
    }

    initializeComponents();

    setState(AssistantState.Connecting);
    setError(null);

    try {
      await audioManagerRef.current?.initialize();
      await audioManagerRef.current?.resumeContext();

      sessionRef.current?.setCallbacks({
        onConnect: () => {
          setState(AssistantState.Listening);
        },
        onDisconnect: () => {
          setState(AssistantState.Idle);
        },
        onSpeakingStart: () => {
          setState(AssistantState.Speaking);
        },
        onSpeakingEnd: () => {
          setState(AssistantState.Listening);
        },
        onListeningStart: () => {
          setState(AssistantState.Listening);
        },
        onListeningEnd: () => {},
        onFunctionCall: handleFunctionCall,
        onError: (err) => {
          setError(err);
          setState(AssistantState.Error);
        },
      });

      sessionRef.current?.setContext(context);

      await sessionRef.current?.connect(GEMINI_API_KEY);

      await audioManagerRef.current?.startMicrophone();

      audioManagerRef.current?.onAudioChunk((pcmData) => {
        if (sessionRef.current?.isConnected() && !isMuted) {
          sessionRef.current?.sendAudioChunk(pcmData);
        }
      });
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      setState(AssistantState.Error);
    }
  }, [context, handleFunctionCall, initializeComponents, isMuted]);

  const handleDisconnect = useCallback(() => {
    audioManagerRef.current?.stopMicrophone();
    sessionRef.current?.disconnect();
    setState(AssistantState.Idle);
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);

    if (!isConnected) {
      void handleConnect();
    }
  }, [handleConnect, isConnected]);

  const handleClose = useCallback(() => {
    handleDisconnect();
  }, [handleDisconnect]);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setIsOpen(false);
  }, []);

  const handleExpand = useCallback(() => {
    setIsMinimized(false);
    setIsOpen(true);
  }, []);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    setState((prev) =>
      prev === AssistantState.Muted
        ? AssistantState.Listening
        : prev === AssistantState.Listening
          ? AssistantState.Muted
          : prev,
    );
  }, []);

  const handlePermissionConfirm = useCallback(() => {
    if (pendingPermission) {
      pendingPermission.resolve({ confirmed: true, cancelled: false });
      setPendingPermission(null);
    }
  }, [pendingPermission]);

  const handlePermissionDeny = useCallback(() => {
    if (pendingPermission) {
      pendingPermission.resolve({ confirmed: false, cancelled: true });
      setPendingPermission(null);
    }
  }, [pendingPermission]);

  useEffect(() => {
    sessionRef.current?.setContext(context);
  }, [context]);

  useEffect(() => {
    return () => {
      handleDisconnect();
      audioManagerRef.current?.destroy();
    };
  }, [handleDisconnect]);

  const getButtonIcon = () => {
    if (!GEMINI_API_KEY) {
      return <Mic className="h-5 w-5" />;
    }

    switch (state) {
      case AssistantState.Connecting:
      case AssistantState.Thinking:
        return <Loader2 className="h-5 w-5 animate-spin" />;
      default:
        return <Mic className="h-5 w-5" />;
    }
  };

  const getButtonStyles = () => {
    switch (state) {
      case AssistantState.Listening:
        return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30';
      case AssistantState.Speaking:
        return 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30';
      case AssistantState.Thinking:
        return 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30';
      case AssistantState.Error:
        return 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30';
      default:
        return 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30';
    }
  };

  if (!GEMINI_API_KEY) {
    return null;
  }

  return (
    <>
      {!isOpen && !isMinimized && (
        <motion.button
          onClick={handleOpen}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full text-white shadow-lg flex items-center justify-center transition-colors ${getButtonStyles()}`}
          aria-label="Ouvrir l'assistant vocal"
        >
          {getButtonIcon()}
        </motion.button>
      )}

      {isMinimized && !isOpen && (
        <FloatingBubble state={state} onExpand={handleExpand} />
      )}

      <GeminiDrawer
        isOpen={isOpen}
        state={state}
        isMuted={isMuted}
        onMinimize={handleMinimize}
        onClose={handleClose}
        onToggleMute={handleToggleMute}
      />

      <PermissionDialog
        isOpen={!!pendingPermission}
        toolName={pendingPermission?.toolName ?? ''}
        description={pendingPermission?.description ?? ''}
        args={pendingPermission?.args ?? {}}
        onConfirm={handlePermissionConfirm}
        onDeny={handlePermissionDeny}
      />

      <AnimatePresence>
        {error && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-48 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white px-4 py-2 rounded-2xl shadow-lg text-xs font-semibold"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-3 underline opacity-80 hover:opacity-100"
            >
              Fermer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
