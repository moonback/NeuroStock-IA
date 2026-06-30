import React, { useEffect, useState } from "react";
import { Camera, CameraOff, Bot } from "lucide-react";

type SettingsTabProps = {
  cameraEnabled: boolean;
  assistantName: string;
  onCameraEnabledChange: (enabled: boolean) => void;
  onAssistantNameChange: (name: string) => void;
};

export function SettingsTab({ cameraEnabled, assistantName, onCameraEnabledChange, onAssistantNameChange }: SettingsTabProps) {
  const [localName, setLocalName] = useState(assistantName);
  const [nameDraft, setNameDraft] = useState(assistantName);

  useEffect(() => {
    setLocalName(assistantName);
    setNameDraft(assistantName);
  }, [assistantName]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameDraft.trim() || "Assistant";
    setLocalName(trimmed);
    onAssistantNameChange(trimmed);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-extrabold text-stone-900">Paramètres</h2>

      {/* Assistant name */}
      <div className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-stone-900">Nom de l'assistant</p>
            <p className="text-[11px] font-medium text-stone-400 mt-0.5">
              Utilisé dans l'appli et le system prompt
            </p>
          </div>
        </div>
        <form onSubmit={handleNameSubmit} className="flex gap-2">
          <input
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={30}
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400"
            placeholder="Nom de l'assistant"
          />
          <button
            type="submit"
            disabled={nameDraft.trim() === localName}
            className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-violet-600/20 transition active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none cursor-pointer hover:bg-violet-500"
          >
            Sauver
          </button>
        </form>
      </div>

      {/* Camera toggle */}
      <div className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`grid h-10 w-10 place-items-center rounded-xl border ${
              cameraEnabled
                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                : "border-stone-200 bg-stone-50 text-stone-400"
            }`}>
              {cameraEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-bold text-stone-900">Scan caméra</p>
              <p className="text-[11px] font-medium text-stone-400 mt-0.5">
                {cameraEnabled ? "Activé — accessible depuis l'onglet Scanner" : "Désactivé — seul le scanner physique est disponible"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onCameraEnabledChange(!cameraEnabled)}
            className={`relative h-8 w-14 rounded-full transition-colors duration-200 flex-shrink-0 cursor-pointer ${
              cameraEnabled ? "bg-indigo-600" : "bg-stone-200"
            }`}
            role="switch"
            aria-checked={cameraEnabled}
            aria-label="Activer ou désactiver le scan caméra"
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                cameraEnabled ? "left-8" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </section>
  );
}
