import { AssistantState } from "./types";

export function GeminiDrawer(props: {
  minimized: boolean;
  state: AssistantState;
  onMinimize: () => void;
  onClose: () => void;
  onToggleMute: () => void;
}) {
  const { minimized, state, onMinimize, onClose, onToggleMute } = props;

  const title = (() => {
    if (state === "Connecting") return "Connexion...";
    if (state === "Listening") return "À l'écoute";
    if (state === "Thinking") return "Je réfléchis";
    if (state === "Speaking") return "Je réponds";
    if (state === "Muted") return "Micro coupé";
    if (state === "Error") return "Erreur";
    return "Assistant";
  })();

  if (minimized) return null;

  return (
    <div className="fixed z-50 inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 sm:bottom-20">
      <div className="mx-auto sm:mr-0 w-full sm:w-[22rem]">
        <div className="glass-card rounded-t-3xl sm:rounded-3xl p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{title}</div>
            <div className="flex items-center gap-2">
              <button className="tap-active glass-input rounded-xl px-3 py-2 text-sm" onClick={onToggleMute}>
                {state === "Muted" ? "⏵" : "⏸"}
              </button>
              <button className="tap-active glass-input rounded-xl px-3 py-2 text-sm" onClick={onClose}>
                ❌
              </button>
              <button className="tap-active glass-input rounded-xl px-3 py-2 text-sm" onClick={onMinimize}>
                ▲
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs opacity-80">
            Pas de texte: uniquement audio.
          </div>

          <div className="mt-4 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-indigo-600" />
            <div className="ml-2 text-sm font-semibold">Julien</div>
            <div className="ml-3 text-xs tabular">{state}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

