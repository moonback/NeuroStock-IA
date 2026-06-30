# 🎙️ Roadmap Assistant Vocal — NeuroStock

> Miroir fonctionnel de `roadmap.md`.
> Pour les features non vocales (scan, stock, catégories, exports), se référer à `roadmap.md`.

---

## 1. Contexte actuel (vérifié dans le code)

| Brique | État | Détail |
|---|---|---|
| Moteur Live | ✅ Actif | Gemini Live (PCM, duplex, stream audio) |
| UX vocale | ✅ Actif | `FloatingBubble` + `GeminiDrawer` (open / minimize / mic / stop) |
| Tools métier | ✅ 8 tools | Recherche produit, MAJ stock, CRUD catégorie, export CSV |
| Sécurité | ✅ Actif | Confirmation UI explicite avant toute action sensible |
| Offline | ✅ Actif | Les tools passent par `inventorySync` (file de synchronisation différée) |

---

## 2. ✅ Livré

| Feature | Fichier(s) source |
|---|---|
| Connexion Gemini Live | `src/hooks/useGeminiAssistant.ts` |
| Drawer + contrôles | `GeminiDrawer.tsx`, `FloatingBubble.tsx` |
| 8 tools métier | `src/components/GeminiAssistant/tools.ts` |
| Confirmation des actions sensibles | `FunctionDispatcher.ts` + modals |
| Bindings offline | Réutilisent la pile existante `useOfflineSync` |

---

## 3. 🎯 Priorisation (Impact / Effort)

Légende : 🟢 quick win · 🟡 à planifier · 🔴 gros chantier

| Feature | Impact | Effort | Priorité |
|---|---|---|---|
| Historique des interactions vocales | Élevé | 1j | 🟢 P0 |
| Alertes stock bas vocales | Élevé | 1j | 🟢 P0 |
| Scan vocal + contexte | Élevé | 2j | 🟢 P1 |
| Commandes batch | Moyen | 2j | 🟡 P1 |
| Mode relevé rapide (hands-free) | Moyen | 2j | 🟡 P1 |
| Multilangue FR/EN/AR | Moyen | 1.5j | 🟡 P2 |
| Rapports financiers vocaux | Moyen | 2j | 🟡 P2 |
| Rapprochement inventaire (comptage vocal) | Élevé | 2.5j | 🟡 P2 |
| Lots / DLC + alertes | Moyen | 3j | 🟡 P2 |
| Templates vocaux | Faible | 1.5j | 🟡 P3 |
| Import/export Excel | Faible | 2j | 🟡 P3 |
| Image sans code-barres (Gemini Vision) | Élevé | 3j | 🔴 P3 |
| Suggestions réapprovisionnement | Élevé | 4j | 🔴 P3 |
| Assistant proactif (rappels planifiés) | Moyen | 3j | 🔴 P4 |
| Feedback vocal post-tâche | Faible | 2.5j | 🔴 P4 |
| Wearables companion | Faible (niche) | 6j | 🔴 P5 |

---

## 4. 🟢 P0 — À livrer en premier

### 4.1 Historique des interactions vocales

**Pourquoi** : traçabilité, debug, retour utilisateur.

**Comment** :
- Table Supabase `voice_interactions` (`id`, `timestamp`, `command`, `arguments`, `status`, `user_session`)
- Affichage compact dans le drawer (3 dernières commandes)
- Export JSON/CSV depuis le drawer
- Politique de rétention à définir (ex. 90 jours) pour limiter la croissance de la table

**Estimation** : 1 jour

---

### 4.2 Alertes stock bas vocales

**Pourquoi** : éviter les ruptures sans que l'utilisateur ait à interroger l'assistant.

**Comment** :
- Détection automatique : `stock <= seuil` (seuil configurable par produit ou catégorie)
- Rapport vocal court à l'ouverture du drawer, ex. *« 3 produits en stock bas »*
- Tool `listLowStock` réutilisable par la commande explicite ET par le déclenchement auto

**Estimation** : 1 jour

---

## 5. 🟡 P1 — Court terme

| Feature | Description | Estimation |
|---|---|---|
| Scan vocal + contexte | Après un scan matériel, l'assistant garde le code-barres en contexte pour enchaîner « Ajoute 5 », « Change le prix à 2,50 » | 2j |
| Commandes batch | « Ajoute 3 Coca et 2 Fanta » → parsing multi-actions + confirmation groupée | 2j |
| Mode relevé rapide (hands-free) | Activation par phrase clé ou bouton physique ; réponse courte sans ouvrir le drawer | 2j |

---

## 6. 🟡 P2 — Moyen terme

| Feature | Description | Estimation |
|---|---|---|
| Multilangue FR/EN/AR | Sélection dans le profil + system prompt dynamique + TTS adapté | 1.5j |
| Rapports financiers vocaux | Tools `getStockValue`, `getCategoryStats`, `getMarginEstimate` | 2j |
| Rapprochement inventaire | Mode « Comptage » : dictée « Coca : 15 », rapport des écarts vocalisé | 2.5j |
| Lots / DLC + alertes | Nouveaux champs + tools `addExpiry` / `listExpiring` + alerte J-7 | 3j |

---

## 7. 🟡 P3 — Backlog planifiable

| Feature | Description | Estimation |
|---|---|---|
| Templates vocaux | « Réappro provision hebdomadaire Boissons » sauvegardé et réutilisable | 1.5j |
| Import/export Excel | Complète l'export CSV existant | 2j |
| Image sans code-barres | Capture photo → Gemini Vision → identification → matching OpenFoodFacts | 3j |
| Suggestions réapprovisionnement | Basé sur `lastMovement` + historique, tool `suggestRestock` | 4j |

---

## 8. 🔴 P4–P5 — Long terme / exploratoire

| Feature | Description | Estimation |
|---|---|---|
| Assistant proactif | Rappels planifiés (« Vérifie les DLC des yaourts », « Stock bas Coca ») | 3j |
| Feedback vocal | Post-tâche : « Comment ça s'est passé ? » → sentiment → dashboard | 2.5j |
| Wearables companion | App companion montre (React Native ou PWA watch) + sync stock | 6j |

---

## 9. ⚠️ Dépendances / risques

| Risque | Impact | Mitigation |
|---|---|---|
| API Gemini Live (disponibilité + quota) | Bloquant si interruption | Fallback texte si la connexion Live échoue ; monitoring des quotas |
| OpenRouter embeddings | Dégradation qualité recherche | Fallback local déjà existant |
| API caisse / API fournisseurs | Bloquant pour les features liées | À spécifier avec les prestataires avant d'estimer ces features |
| Wearables companion | Fort impact technique | Nécessite un build séparé (React Native / Expo) — à traiter comme un projet à part |

---

## 10. 📊 KPIs vocal

| Métrique | Cible | Notes |
|---|---|---|
| Temps de réponse Live | < 2 s | Mesuré du end-of-speech au premier token audio |
| Taux de confirmation | > 90 % des actions validées | Sur les actions nécessitant confirmation UI |
| Taux de compréhension (tool call réussi) | > 85 % | Hors faux positifs liés au bruit ambiant |
| Adoption équipe | > 60 % des utilisateurs actifs | Mesuré sur une fenêtre glissante de 30 jours |

---

_Dernière mise à jour : Juin 2026_