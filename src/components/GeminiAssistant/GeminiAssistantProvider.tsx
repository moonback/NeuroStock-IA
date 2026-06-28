import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic } from 'lucide-react';
import { GeminiAssistantContext, GeminiAssistantContextValue } from './GeminiAssistantContext';
import { AssistantState, AssistantContext } from './types';
import { LiveSession } from './LiveSession';
import { AudioManager } from './AudioManager';
import { FunctionDispatcher, DialogResult } from './FunctionDispatcher';
import { GeminiDrawer } from './GeminiDrawer';
import { FloatingBubble } from './FloatingBubble';
import { PermissionDialog } from './PermissionDialog';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface GeminiAssistantProviderProps {
  children: React.ReactNode;
  context: AssistantContext;
  onExportCSV?: () => void;
  onRefresh?: () => Promise<void>;
}

export function GeminiAssistantProvider({
  children,
  context,
  onExportCSV,
  onRefresh,
}: GeminiAssistantProviderProps) {
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
    async (
      call: { id: string; name: string; args: Record<string, unknown> },
      isDestructive: boolean,
    ): Promise<unknown> => {
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

      if (
        onRefresh &&
        (call.name.includes('Stock') ||
          call.name.includes('Category') ||
          call.name === 'deleteProduct')
      ) {
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

  const open = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);

    if (!isConnected) {
      void handleConnect();
    }
  }, [handleConnect, isConnected]);

  const close = useCallback(() => {
    handleDisconnect();
  }, [handleDisconnect]);

  const minimize = useCallback(() => {
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

  const contextValue: GeminiAssistantContextValue = {
    open,
    close,
    minimize,
    isOpen,
    isMinimized,
    state,
    error,
  };

  if (!GEMINI_API_KEY) {
    return <>{children}</>;
  }

  return (
    <GeminiAssistantContext.Provider value={contextValue}>
      {children}

      {/* Floating trigger button when closed and not minimized */}
      {!isOpen && !isMinimized && (
        <motion.button
          onClick={open}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-colors hover:bg-indigo-700"
          aria-label="Ouvrir Julien, l'assistant vocal"
        >
          <Mic className="h-6 w-6" />
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-white/50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.button>
      )}

      {/* Minimized bubble */}
      {isMinimized && !isOpen && (
        <FloatingBubble state={state} onExpand={handleExpand} />
      )}

      {/* Main drawer */}
      <GeminiDrawer
        isOpen={isOpen}
        state={state}
        isMuted={isMuted}
        onMinimize={minimize}
        onClose={close}
        onToggleMute={handleToggleMute}
      />

      {/* Permission confirmation dialog */}
      <PermissionDialog
        isOpen={!!pendingPermission}
        toolName={pendingPermission?.toolName ?? ''}
        description={pendingPermission?.description ?? ''}
        args={pendingPermission?.args ?? {}}
        onConfirm={handlePermissionConfirm}
        onDeny={handlePermissionDeny}
      />
    </GeminiAssistantContext.Provider>
  );
}
