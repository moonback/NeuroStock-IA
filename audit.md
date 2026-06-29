Basé sur l’inspection du code, voici mon analyse et mes recommandations pour implémenter l’IA au cœur du système de façon proactive.

1. État des lieux : ce qui existe déjà
Couche	Outil / Module	Usage actuel
Assistant vocal	GeminiAssistantProvider + LiveSession	Tools métiers réactifs (search, update, create, delete, export).
Embeddings	embeddingService.ts + useEmbeddingGenerator.ts	Génération batch manuelle (OpenRouter obligatoire sinon fallback local).
Auto-catégorisation	autoCategorization.ts	Règles regex hardcodées (statiques, non adaptatives).
Recherche	App.tsx	Filtrage substring simple dans l’UI + semanticSearchProduct dans l’assistant vocal.
System prompt	systemPrompt.ts	Injecte tout l’inventaire en plain text à Gemini → risque de tokens explosés.
Supabase	REST + Realtime + Storage	Sync offline-first, mais pas de logique “intelligente” côté DB.
2. Faiblesses qui empêchent l’IA d’être proactive
Prompt trop verbeux : l’inventaire entier est envoyé à Gemini à chaque session → latence + limites de contexte.
Embeddings non automatiques : créés seulement au scan/batch manuel, pas à chaque modification de produit.
Catégorisation figée : règles locales hardcodées, pas d’apprentissage ni de suggestion dynamique depuis les ventes réelles.
Aucune prédiction : pas d’anticipation de rupture, pas de suggestion de réapprovisionnement.
Aucune vision : pas d’OCR / reconnaissance image pour produits sans code-barres.
Pas de mémoire conversationnelle : chaque ouverture de l’assistant repart de zéro.
3. Plan d’implémentation IA proactive (par étapes)
Étape 1 — Réduire la dette prompt + automatiser les embeddings (0 risque)
Objectif : rendre l’assistant plus rapide et les embeddings toujours à jour.

Actions :

Dans systemPrompt.ts, retirer l’inventaire complet du prompt et le remplacer par un résumé compact (statistiques + top 5 low stock). Prévoir un tool lookupProductContext(barcode) pour que Gemini appelle seulement ce dont il a besoin.
Dans App.tsx : englober generateProductEmbedding dans un helper autoEmbed(item) appelé systématiquement à chaque createProduct, updateProduct, et import. Ça rend la recherche sémantique toujours disponible sans batch manuel.
Étape 2 — Ajouter des tools proactifs à “Lina”
Objectif : l’assistant propose des actions sans qu’on le lui demande.

Tools à ajouter dans tools.ts + handlers dans App.tsx :

Tool	Comportement
suggestRestock	Retourne les 5 produits à commander en priorité (critère : stock < seuils dynamiques basés sur lastMovement).
detectAnomalies	Détecte prix aberrants (ex: prix de vente < prix d’achat), doublons potentiels, ou mouvements suspects.
generateDailyInsights	Résumé vocal automatique au lancement ou sur demande : top mouvements, rupture imminente, valeur stock.
smartCategorySuggestion	Suggère une catégorie via Gemini (nom + marque) quand les règles regex échouent.
Étape 3 — IA prédictive stock (légère, sans nouveau modèle)
Objectif : anticiper les besoins sans dépendre d’un modèle coûteux.

Ajouter un champ lastMovements: number[] (ou une table stock_events) pour historiser les quantités.
Calculer un moving average côté Supabase (ou client) et stocker predictedDailyConsumption.
Ajouter un champ predictedStockAt(date) et daysUntilStockout.
Utiliser ça dans suggestRestock et dans l’UI StockTab (badge “épuisé dans ~3 jours”).
Étape 4 — Vision produits (OCR / Gemini Vision) (nouvelle compétence pour toi)

Objectif : remplir un produit par photo quand le code-barres échoue.

Intégrer un bouton “Scanner par photo” dans ManualProductModal.
Utiliser GoogleGenAI avec le modèle gemini-2.0-flash (multimodal) pour extraire nom, marque, format depuis l’image.
Retourner un payload ProductLookupData enrichi, prêt à enregistrer.
Étape 5 — Automatisation background (Supabase Edge Function)
Objectif : l’IA travaille même quand personne n’utilise l’app.

Créer une Edge Function Supabase qui :
Chaque nuit, régénère les embeddings manquants (ceux créés sans OpenRouter ou modifiés).
Déclenche suggestRestock et envoie une notification (si stock bas dans >48h).
Détecte et propose de fusionner les doublons (même nom + marque + catégorie).
Cela déplace la logique “intelligente” du client vers le serveur = plus fiable.
4. Priorisation recommandée
Priorité	Étape	Impact	Effort
P0	1 — Prompt allégé + auto-embeddings	Latence ↓, sémantique fiable	~0.5j
P1	2 — Tools proactifs Lina	Différenciateur immédiat	~1j
P2	3 — Prédiction stock simple	ROI métier direct	~1.5j
P3	4 — Vision / OCR	Nouveau canal d’entrée	~2j
P4	5 — Edge Function background	Scalabilité	~2j
On commence par quelle étape ?