import { useMemo } from "react";

export function FloatingBubble(props: {
  minimized: boolean;
  state: string;
  onClick: () => void;
  position: { x: number; y: number };
  onDragStart: () => void;
  onDrag: (x: number, y: number) => void;
  onDragEnd: () => void;
}) {
  const { minimized, state, onClick, position, onDragStart, onDrag, onDragEnd } = props;

  const label = useMemo(() => {
    if (state === "Muted") return "(muet)";
    if (state === "Listening") return "● Julien";
    if (state === "Speaking") return "Julien";
    return "● Julien";
  }, [state]);

  if (!minimized) return null;

  return (
    <div
      className="fixed z-50 right-4 bottom-24 select-none touch-pan-x touch-pan-y"
      style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      onPointerDown={(e) => {
        e.preventDefault();
        onClick();
        onDragStart();
      }}
      role="button"
      aria-label="Assistant vocal"
    >
      <div
        className="glass-card rounded-full px-4 py-3 flex items-center gap-3 shadow-lg"
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          onDrag(position.x + e.movementX, position.y + e.movementY);
        }}
        onPointerUp={() => onDragEnd()}
      >
        <div className="w-3 h-3 rounded-full bg-indigo-600" />
        <div className="text-sm font-semibold">{label}</div>
      </div>
    </div>
  );
}

