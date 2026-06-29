import { useEffect, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, Scan, Package, Wifi, Bot, CheckCircle2 } from "lucide-react";

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

interface Step {
  title: string;
  description: string;
  icon: ReactNode;
}

const STORAGE_PREFIX = "neurostock_onboarding_done_";

export function Onboarding({ userId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const done = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (done) onComplete();
  }, [userId, onComplete]);

  const steps: Step[] = [
    {
      title: "Bienvenue sur NeuroStock",
      description:
        "Gérez votre inventaire simplement : scannez, suivez et synchronisez vos stocks en temps réel.",
      icon: <CheckCircle2 className="h-10 w-10 text-indigo-600" />,
    },
    {
      title: "Scannez vos produits",
      description:
        "Utilisez le scanner physique ou l'appareil photo pour ajouter des produits en un instant.",
      icon: <Scan className="h-10 w-10 text-indigo-600" />,
    },
    {
      title: "Suivez votre stock",
      description:
        "Visualisez les quantités, les alertes de stock bas et classifiez par catégories.",
      icon: <Package className="h-10 w-10 text-indigo-600" />,
    },
    {
      title: "Synchronisation",
      description:
        "Toutes les modifications sont synchronisées automatiquement quand vous êtes en ligne.",
      icon: <Wifi className="h-10 w-10 text-indigo-600" />,
    },
    {
      title: "Assistant vocal",
      description:
        "Posez des questions à l'assistant pour mettre à jour le stock ou chercher un produit.",
      icon: <Bot className="h-10 w-10 text-indigo-600" />,
    },
  ];

  const next = () => {
    setDirection(1);
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  };

  const skip = () => finish();

  const finish = () => {
    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, "1");
    onComplete();
  };

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 p-5 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={skip}
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition cursor-pointer"
          aria-label="Fermer l'onboarding"
        >
          <X className="h-4 w-4" />
        </button>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 60 : -60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -60 : 60 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                {current.icon}
              </div>
              <h2 className="text-lg font-extrabold text-stone-900">{current.title}</h2>
              <p className="text-sm text-stone-500 leading-relaxed">{current.description}</p>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5">
              {steps.map((_, idx) => (
                <span
                  key={idx}
                  className={
                    idx === step
                      ? "h-2 w-2 rounded-full bg-indigo-600"
                      : "h-2 w-2 rounded-full bg-stone-200"
                  }
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition cursor-pointer select-none"
            >
              {step < steps.length - 1 ? (
                <>
                  <span>Continuer</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              ) : (
                <span>Commencer</span>
              )}
            </button>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
