import { useState, FormEvent, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CategoryItem } from '../types';

const COMMON_EMOJIS = [
  '🥛', '🍖', '🐟', '🥫', '🍝', '🍚', '🥦', '🍎', '🍪', '🍫', '🥤', '🧂', '🧊', '🧹', '🧻',
  '🍞', '🥐', '🥩', '🧀', '🥚', '🍯', '🍵', '🍷', '🍺', '🧴', '🧼', '💊', '🔋', '📦', '🏷️',
];

interface CategoryModalProps {
  isOpen: boolean;
  category?: CategoryItem | null;
  categoryId?: string;
  onClose: () => void;
  onSave: (category: CategoryItem) => Promise<void>;
  showToast: (text: string) => void;
}

export function CategoryModal({ isOpen, category, categoryId, onClose, onSave, showToast }: CategoryModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(category?.name ?? '');
      setIcon(category?.icon || '📦');
      setIsLoading(false);
    }
  }, [isOpen, categoryId]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onSave({
        id: category?.id,
        name: name.trim(),
        icon: icon.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Erreur lors de la sauvegarde de la catégorie.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[9998] bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-[9999] rounded-t-[2rem] border border-slate-200/60 bg-white/95 backdrop-blur-xl p-5 shadow-2xl shadow-slate-900/10 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-sm sm:rounded-[2rem]"
            role="dialog"
            aria-modal="true"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-300 sm:hidden" />

            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  {category ? 'Modifier la catégorie' : 'Créer une catégorie'}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 -mr-2 -mt-2 text-slate-400 hover:text-slate-900 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Icône</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full h-10 text-center rounded-xl text-lg border border-slate-200 bg-white outline-none transition"
                    placeholder="📦"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Nom de la catégorie *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl text-xs font-semibold text-slate-900 outline-none transition border border-slate-200 bg-white"
                    placeholder="Ex: Épicerie, Boissons..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Suggestions d&apos;icônes</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                  {COMMON_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setIcon(emoji)}
                      className={`h-9 w-9 flex items-center justify-center rounded-lg text-base transition hover:bg-slate-100 ${icon === emoji ? 'bg-indigo-50 border border-indigo-200' : ''}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 px-4 text-[10px] font-bold text-slate-500 bg-transparent border border-slate-200 hover:bg-slate-50 rounded-2xl transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="h-11 px-4 text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl transition flex items-center gap-1 shadow-md shadow-indigo-600/20 disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                  Sauvegarder
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
