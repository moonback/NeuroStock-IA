# IA Proactive & Composants Futuristes Pertinents — Plan d'implémentation

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Rendre l’assistant **Lina** proactive (détection automatique d’anomalies inventaire, suggestions contextuelles sans demande vocale) et ajouter des composants UI futuristes mais pertinents pour ces signaux.

**Architecture:** Un moteur `proactiveEngine` analyse `inventory` + `categories` et génère des `ProactiveSignal`. Un panneau `ProactiveFeed` s’intègre dans le drawer Lina. Le FloatingBubble réagit à l’état proactif. Les signaux sont injectés comme contexte dans le system prompt.

**Tech Stack:** React 19, TypeScript strict, Tailwind v4, Motion v12, Zustand/LiveSession existant, Supabase déjà branché pour le contexte.

---

## Step 1 — Créer le répertoire plans si nécessaire

### Task 1: Create .hermes/plans directory

**Objective:** Ensure `.hermes/plans/` exists before saving plans

**Files:**
- Create: `.hermes/plans/` (directory)
- Test: none

**Step 1: Create directory**

Run: `mkdir -p .hermes/plans`
Expected: silent success

**Step 2: Verify**

Run: `ls -la .hermes/plans`
Expected: directory listed

**Step 3: Commit** *(optional, usually plan files are not committed)*

```bash
git status
```

---

## Step 2 — Ajouter le type ProactiveSignal

### Task 2: Define ProactiveSignal type in src/types.ts

**Objective:** Add exact type for proactive signals used by engine + UI

**Files:**
- Modify: `src/types.ts`

**Step 1: Open file**

```bash
sed -n '1,200p' src/types.ts
```

**Step 2: Add types after existing exports**

```ts
export type ProactiveSignalCategory =
  | 'critical'
  | 'warning'
  | 'info';

export interface ProactiveSignal {
  id: string;
  category: ProactiveSignalCategory;
  title: string;
  detail: string;
  barcode?: string;
  actionHint?: string;
  createdAt: number;
}
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: only pre-existing errors (we only added declarations)

**Step 4: Commit**

```bash
git add src/types.ts
git commit -m "types: add ProactiveSignal contract"
```

---

## Step 3 — Implémenter le moteur proactif

### Task 3: Implement proactiveEngine.ts

**Objective:** Analyze inventory and emit typed proactive signals

**Files:**
- Create: `src/lib/proactiveEngine.ts`

**Step 1: Write engine**

```ts
export interface ProactiveInput {
  inventory: Array<{
    barcode: string;
    name: string;
    quantity: number;
    category?: string;
    brand?: string;
    purchasePrice?: number;
    salesPrice?: number;
    lastUpdated?: number;
    lastMovement?: number;
  }>;
  categories: Array<{ name: string }>;
}

export interface ProactiveSignal {
  id: string;
  category: 'critical' | 'warning' | 'info';
  title: string;
  detail: string;
  barcode?: string;
  actionHint?: string;
  createdAt: number;
}

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function pickCategory(stock: number): 'critical' | 'warning' | 'info' {
  if (stock === 0) return 'critical';
  if (stock <= 5) return 'warning';
  return 'info';
}

export function buildProactiveSignals(input: ProactiveInput): ProactiveSignal[] {
  const signals: ProactiveSignal[] = [];
  const products = input.inventory;
  const categories = new Set(input.categories.map((c) => c.name));

  for (const product of products) {
    // 1) Rupture ou faible stock avec demande récente
    if (product.lastMovement && product.lastMovement > 0 && product.quantity <= 5) {
      signals.push({
        id: uid(),
        category: pickCategory(product.quantity),
        title: product.quantity === 0 ? 'Rupture de stock' : 'Stock très bas',
        detail: `${product.name} (${product.brand ?? 'sans marque'}) — qty: ${product.quantity}`,
        barcode: product.barcode,
        actionHint: product.quantity === 0 ? 'Commander ou supprimer la référence' : 'Prévoir le réassort',
      });
      continue;
    }

    // 2) Produit en stock sans mouvement récent (alerte info)
    if (product.quantity > 0 && product.lastUpdated && Date.now() - product.lastUpdated > 7 * 24 * 60 * 60 * 1000) {
      signals.push({
        id: uid(),
        category: 'info',
        title: 'Stock dormant',
        detail: `${product.name} n’a pas bougé depuis 7j (qty: ${product.quantity})`,
        barcode: product.barcode,
        actionHint: 'Vérifier la rotation ou appliquer une promo',
      });
    }
  }

  // 3) Catégorie hors inventaire / orpheline (info)
  for (const category of categories) {
    const inCategory = products.filter((p) => p.category === category);
    if (inCategory.length === 0 && products.length > 0) {
      signals.push({
        id: uid(),
        category: 'info',
        title: 'Catégorie vide',
        detail: `Aucun produit dans la catégorie « ${category} »`,
        actionHint: 'Mettre à jour la catégorie ou supprimer la fiche',
      });
    }
  }

  // 4) Marge trop faible (warning)
  for (const product of products) {
    if (typeof product.purchasePrice === 'number' && typeof product.salesPrice === 'number' && product.salesPrice > 0) {
      const margin = product.salesPrice - product.purchasePrice;
      const ratio = margin / product.salesPrice;
      if (ratio < 0.15 && product.quantity > 0) {
        signals.push({
          id: uid(),
          category: 'warning',
          title: 'Marge faible',
          detail: `marge ${(ratio * 100).toFixed(1)}% sur ${product.name}`,
          barcode: product.barcode,
          actionHint: 'Revoir le prix de vente ou le coût d’achat',
        });
      }
    }
  }

  return signals;
}
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: no errors from new file

**Step 3: Commit**

```bash
git add src/lib/proactiveEngine.ts
git commit -m "feat: add proactive inventory signal engine"
```

---

## Step 4 — Ajouter les composants UI Proactive

### Task 4: Add ProactiveSignalCard component

**Objective:** Futuriste mais lisible card pour chaque signal proactif

**Files:**
- Create: `src/components/Proactive/ProactiveSignalCard.tsx`
- Create: `src/components/Proactive/index.ts`

**Step 1: Write ProactiveSignalCard**

```tsx
import { motion } from 'motion/react';
import { AlertTriangle, Info, Zap } from 'lucide-react';
import type { ProactiveSignal } from '../../types';

const STYLE: Record<string, string> = {
  critical: 'bg-rose-50 text-rose-700 border-rose-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const ICON: Record<string, typeof Info> = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

interface Props {
  signal: ProactiveSignal;
  onTap?: (signal: ProactiveSignal) => void;
  index: number;
}

export function ProactiveSignalCard({ signal, onTap, index }: Props) {
  const Icon = ICON[signal.category] ?? Info;
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onTap?.(signal)}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${STYLE[signal.category]} bg-white/80 backdrop-blur-sm shadow-xs`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-current/10 bg-white/70">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-extrabold uppercase tracking-wider">{signal.title}</p>
          <p className="mt-1 text-sm font-semibold leading-snug">{signal.detail}</p>
          {signal.actionHint && (
            <p className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold">
              <Zap className="h-3 w-3" />
              {signal.actionHint}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
```

**Step 2: Write index.ts**

```ts
export { ProactiveSignalCard } from './ProactiveSignalCard';
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit`
Expected: pass

**Step 4: Commit**

```bash
git add src/components/Proactive
git commit -m "feat: add proactive signal card component"
```

### Task 5: Add ProactiveFeed panel

**Objective:** Minimal futuriste feed inside drawer

**Files:**
- Create: `src/components/Proactive/ProactiveFeed.tsx`

**Step 1: Write component**

```tsx
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProactiveSignalCard } from './ProactiveSignalCard';
import type { ProactiveSignal } from '../../types';

interface Props {
  title: string;
  signals: ProactiveSignal[];
  onOpen: (signal: ProactiveSignal) => void;
}

const EMPTY_LIST = [
  { category: 'info', title: 'Aucun signal', detail: 'Tout est calme pour le moment.', barcode: undefined, actionHint: undefined },
];

export function ProactiveFeed({ title, signals, onOpen }: Props) {
  const items = useMemo(() => (signals.length ? signals : EMPTY_LIST), [signals]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-stone-500">{title}</h3>
        <span className="rounded-full border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-bold text-stone-500">
          {signals.length}
        </span>
      </div>
      <div className="space-y-2.5">
        <AnimatePresence initial>
          {items.map((signal, index) => (
            <ProactiveSignalCard key={signal.id} signal={signal} index={index} onTap={onOpen} />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
```

**Step 2: Export from index**

Add `ProactiveFeed` to `src/components/Proactive/index.ts`.

**Step 3: Typecheck**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/components/Proactive/ProactiveFeed.tsx src/components/Proactive/index.ts
git commit -m "feat: add proactive feed panel"
```

---

## Step 5 — Brancher l’UI dans le drawer Lina

### Task 6: Add Proactive tab to GeminiDrawer

**Objective:** Proposer un onglet “Signaux” futuriste dans le drawer

**Files:**
- Modify: `src/components/GeminiAssistant/GeminiDrawer.tsx`
- Modify: `src/components/GeminiAssistant/index.ts` (si export)

**Step 1: Ajouter un onglet + panneau**

Modifier le header pour ajouter un toggle onglets `Assistant | Signaux`, puis intégrer `<ProactiveFeed ... />` quand l’onglet Signaux est actif.

**Step 2: Brancher le handler onOpen pour naviguer vers le produit**

Quand on tape sur un signal, définir `onOpen(signal)` → l’App doit ouvrir le modal détails si `barcode` présent.

**Step 3: Typecheck**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/components/GeminiAssistant/GeminiDrawer.tsx
git commit -m "feat: add proactive signals tab in assistant drawer"
```

---

## Step 6 — Connecter les signaux à l’App

### Task 7: Compute and expose proactive signals in App.tsx

**Objective:** Générer les signaux à partir de l’inventaire courant et fournir les handlers

**Files:**
- Modify: `src/App.tsx`

**Step 1: Importer le moteur**

Ajouter `buildProactiveSignals` + créer un state `proactiveSignals`.

**Step 2: Recalculer quand inventory/categories changent**

`useMemo(() => buildProactiveSignals({ inventory, categories: dbCategories }), [inventory, dbCategories])`

**Step 3: Handler pour ouvrir un produit**

Si `signal.barcode` existe, chercher le produit dans `inventory` et ouvrir `ProductDetailsModal`.

**Step 4: Prop drilling jusqu’au drawer**

Passer `proactiveSignals` + `onOpenProductFromSignal` à `GeminiAssistantProvider` ou via context.

Simplification recommandée : étendre `AssistantExternalContext` (déjà injecté au system prompt) avec un champ `proactiveSignals`, et ajouter un state dédié au provider ou à l’App.

Évite d’alourdir App.tsx. On peut donc :
- Ajouter `proactiveSignals?: ProactiveSignal[]` dans `AssistantExternalContext`
- Mettre à jour `getContext` dans App.tsx pour inclure `proactiveSignals`
- Mettre à jour `buildSystemPrompt` pour mentionner les signaux proactifs
- Le drawer consomme les signaux via un nouveau context `ProactiveContext` ou directement depuis `App.tsx` props.

**Step 5: Typecheck + Commit**

```bash
git add src/App.tsx
git commit -m "feat: expose proactive signals to assistant drawer"
```

---

## Step 7 — Enrichir le contexte Lina pour préparation proactive vocale

### Task 8: Include proactive signals in system prompt

**Objective:** Lina sait quels signaux sont actifs et peut proposer l’action sans qu’on lui demande

**Files:**
- Modify: `src/components/GeminiAssistant/systemPrompt.ts`

**Step 1: Update buildSystemPrompt**

Ajouter une section `# 📡 SIGNAUX PROACTIFS` listant au max 3 signaux prioritaires, avec barcode et action suggérée.

**Step 2: Typecheck**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/components/GeminiAssistant/systemPrompt.ts
git commit -m "feat: inject proactive signals into Lina system prompt"
```

---

## Step 8 — Rendre le FloatingBubble proactive

### Task 9: Add proactive-aware FloatingBubble state

**Objective:** Quand des signaux existent, le bubble pulse ou affiche un indic futuriste (ex: vague orangée) sans être intrusif

**Files:**
- Modify: `src/components/GeminiAssistant/FloatingBubble.tsx`

**Step 1: Ajouter une prop `proactiveCount`**

- 0 → comportement normal
- >0 → anneau/sonar additionnel coloré ambre/violet

**Step 2: Commit**

```bash
git add src/components/GeminiAssistant/FloatingBubble.tsx
git commit -m "feat: proactive indicator on floating bubble"
```

---

## Step 9 — Améliorer le drawer avec un design futuriste mais lisible

### Task 10: Futuriste-relevant drawer polish

**Objective:** Garder un design sobre (fond blanc/near-white), accents indigo, pas de grain/beige, composants fonctionnels

**Files:**
- Modify: `src/components/GeminiAssistant/GeminiDrawer.tsx`
- Modify: `src/index.css`

**Step 1: Ajouter les utilitaires glass**

```css
.glass-signal {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(18px) saturate(1.6);
  -webkit-backdrop-filter: blur(18px) saturate(1.6);
}
```

**Step 2: Commit**

```bash
git add src/index.css src/components/GeminiAssistant/GeminiDrawer.tsx
git commit -m "style: add glass-signal utility for proactive panels"
```

---

## Step 10 — Validation finale

### Task 11: Full validation

**Objective:** Verify everything compiles and Panther design is coherent

**Step 1: Run typecheck**

Run: `npx tsc --noEmit`
Expected: pass

**Step 2: Run build**

Run: `npm run build`
Expected: pass

**Step 3: Optional design audit**

Run: `npm run lint` (if script exists)

**Step 4: Commit all**

```bash
git add .
git commit -m "feat: proactive signals + futurist reactive components"
```

---

## Files likely to change (summary)

- `src/types.ts`
- `src/lib/proactiveEngine.ts` (new)
- `src/components/Proactive/` (new folder + 2 files)
- `src/components/GeminiAssistant/GeminiDrawer.tsx`
- `src/components/GeminiAssistant/systemPrompt.ts`
- `src/components/GeminiAssistant/FloatingBubble.tsx`
- `src/App.tsx`

## Tests / validation

- `npx tsc --noEmit` après chaque tâche avec fichier TS modifié
- `npm run build` à la fin
- Vérification manuelle : ouvrir l’app, vérifier que les signaux s’affichent quand stock bas / marge faible / catégorie vide
- Vérifier que Lina propose l’action adéquate quand on lui parle depuis cet état

## Risks, tradeoffs, open questions

- **Performance** : `buildProactiveSignals` doit rester sous 5ms pour < 10k produits → algorithme linéaire, acceptable.
- **Performance JS** : pas de surcharger le system prompt → limiter à 3 signaux prioritaires (par timestamp, priorité category puis key hint).
- **Du code** : extraction de constante de style/mapping dans `src/lib/proactiveEngine.ts` possible avantageusement.
- **UX** : le drawer est déjà chargé ; l’ajout d’un onglet ne doit pas casser l’expérience mobile → privilégier swipe/toggle compact.
- **IA proactive** : Lina doit-elle déclencher un `triggerProactiveSignal` tool ? Non nécessaire dans un premier temps ; lire suffit. Optimisation future.
- **Futuriste vs pertinent** : on évite les effets déco (grain, néon trop fort, textes fantaisistes) ; on garde : glass, micro-animations Motion, indicateurs état, spacing mobile-first.
