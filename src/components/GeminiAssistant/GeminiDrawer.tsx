import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Loader as Loader2, Volume2, VolumeX, Minimize2, X } from 'lucide-react';
import { AssistantState } from './types';

interface GeminiDrawerProps {
  isOpen: boolean;
  state: AssistantState;
  isMuted: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onToggleMute: () => void;
}

export function GeminiDrawer({
  isOpen,
  state,
  isMuted,
  onMinimize,
  onClose,
  onToggleMute,
}: GeminiDrawerProps) {
  const getStateContent = () => {
    switch (state) {
      case AssistantState.Connecting:
        return {
          title: 'Connexion en cours',
          subtitle: 'Établissement de la liaison...',
          animation: 'pulse',
          icon: <Loader2 className="h-8 w-8 animate-spin text-sky-500" />,
        };
      case AssistantState.Listening:
        return {
          title: 'Je vous écoute',
          subtitle: 'Parlez naturellement...',
          animation: 'listening',
          icon: <Mic className="h-8 w-8 text-emerald-500" />,
        };
      case AssistantState.Speaking:
        return {
          title: 'Julien parle',
          subtitle: 'Réponse en cours...',
          animation: 'speaking',
          icon: <Volume2 className="h-8 w-8 text-indigo-500" />,
        };
      case AssistantState.Thinking:
        return {
          title: 'Réflexion',
          subtitle: 'Analyse de votre demande...',
          animation: 'thinking',
          icon: <Loader2 className="h-8 w-8 animate-spin text-amber-500" />,
        };
      case AssistantState.Error:
        return {
          title: 'Erreur',
          subtitle: 'Tapez pour réessayer',
          animation: 'error',
          icon: <VolumeX className="h-8 w-8 text-rose-500" />,
        };
      case AssistantState.Muted:
        return {
          title: 'Micro désactivé',
          subtitle: 'Tapez pour activer',
          animation: 'muted',
          icon: <MicOff className="h-8 w-8 text-stone-400" />,
        };
      default:
        return {
          title: 'Julien',
          subtitle: 'Assistant vocal prêt',
          animation: 'idle',
          icon: <Mic className="h-8 w-8 text-indigo-500" />,
        };
    }
  };

  const content = getStateContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl shadow-stone-900/25 overflow-hidden pb-safe"
          >
            <div className="flex justify-center py-3 sm:hidden">
              <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
            </div>

            <div className="p-6">
              <div className="absolute top-4 right-4 flex items-center gap-2 sm:right-6">
                <button
                  onClick={onMinimize}
                  className="p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition"
                  aria-label="Réduire"
                >
                  <Minimize2 className="h-5 w-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100 transition"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                <motion.div
                  className="relative"
                  animate={
                    state === AssistantState.Listening
                      ? { scale: [1, 1.05, 1] }
                      : state === AssistantState.Speaking
                        ? { scale: [1, 1.02, 1] }
                        : {}
                  }
                  transition={{
                    duration: state === AssistantState.Listening ? 0.8 : 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-stone-100">
                    {content.icon}
                    {(state === AssistantState.Listening ||
                      state === AssistantState.Speaking) && (
                      <>
                        <motion.span
                          className="absolute inset-0 rounded-full border-2 border-indigo-500/30"
                          animate={{
                            scale: [1, 1.5],
                            opacity: [0.5, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeOut',
                          }}
                        />
                        <motion.span
                          className="absolute inset-0 rounded-full border-2 border-indigo-500/20"
                          animate={{
                            scale: [1, 1.8],
                            opacity: [0.3, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'easeOut',
                            delay: 0.3,
                          }}
                        />
                      </>
                    )}
                  </div>
                </motion.div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-stone-900">
                    {content.title}
                  </h3>
                  <p className="text-sm text-stone-500">{content.subtitle}</p>
                </div>

                <div className="flex items-center justify-center gap-4 pt-2">
                  <button
                    onClick={onToggleMute}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition ${
                      isMuted
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                    aria-label={isMuted ? 'Activer le micro' : 'Désactiver le micro'}
                  >
                    {isMuted ? (
                      <MicOff className="h-5 w-5" />
                    ) : (
                      <Mic className="h-5 w-5" />
                    )}
                  </button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`h-16 w-16 rounded-full flex items-center justify-center shadow-lg transition ${
                      isMuted || state === AssistantState.Connecting
                        ? 'bg-stone-200 text-stone-400'
                        : state === AssistantState.Listening
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                          : state === AssistantState.Speaking
                            ? 'bg-indigo-600 text-white shadow-indigo-600/30'
                            : 'bg-indigo-600 text-white shadow-indigo-600/30'
                    }`}
                    disabled={state === AssistantState.Connecting}
                  >
                    {state === AssistantState.Connecting ? (
                      <Loader2 className="h-7 w-7 animate-spin" />
                    ) : state === AssistantState.Listening ? (
                      <Mic className="h-7 w-7" />
                    ) : state === AssistantState.Speaking ? (
                      <Volume2 className="h-7 w-7" />
                    ) : (
                      <Mic className="h-7 w-7" />
                    )}
                  </motion.button>

                  <button
                    className="h-12 w-12 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center hover:bg-stone-200 transition"
                    aria-label="Volume"
                  >
                    <Volume2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-stone-400 mt-4">
                Dites "Bonjour" pour commencer
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
