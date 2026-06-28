import { useMemo } from "react";

export function PermissionDialog(props: {
  open: boolean;
  title: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const {
    open,
    title,
    detail,
    confirmLabel = "Oui",
    cancelLabel = "Non",
    onConfirm,
    onCancel,
  } = props;

  const detailNode = useMemo(() => {
    if (!detail) return null;
    return <div className="text-xs sm:text-sm opacity-80 whitespace-pre-wrap">{detail}</div>;
  }, [detail]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-4 sm:p-5">
        <div className="font-semibold text-sm sm:text-base">{title}</div>
        <div className="mt-2">{detailNode}</div>
        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 tap-active glass-input rounded-xl px-3 py-2 text-sm"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="flex-1 tap-active bg-indigo-600 text-white rounded-xl px-3 py-2 text-sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

