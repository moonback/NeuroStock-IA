
# Guide de Configuration de la Vectorisation des Produits

Ce document explique comment configurer et utiliser la vectorisation des produits pour la recherche sémantique avec Gemini et Supabase.

## Prérequis

1. Un compte Supabase avec la base de données configurée
2. L'extension `pgvector` activée dans Supabase
3. Une clé API Gemini valide

## Étape 1: Activer pgvector dans Supabase

Avant d'appliquer la migration, vous devez activer l'extension `pgvector` dans votre projet Supabase :

1. Allez dans le dashboard Supabase → Database → Extensions
2. Recherchez "vector"
3. Activez l'extension

## Étape 2: Appliquer la Migration SQL

Exécutez le fichier de migration `supabase/migrations/001_add_embedding_column.sql` dans votre base de données Supabase :

1. Dans le dashboard Supabase, allez dans SQL Editor
2. Créez une nouvelle requête
3. Collez le contenu du fichier de migration
4. Exécutez la requête

## Étape 3: Configurer les Variables d'Environnement

Ajoutez les variables suivantes dans votre fichier `.env` (ou `.env.local`) :

```env
# Clé API Gemini (déjà requise pour l'assistant vocal)
VITE_GEMINI_API_KEY=votre_cle_api_gemini

# Modèle d'embedding Gemini (optionnel, défaut: text-embedding-004)
VITE_GEMINI_EMBEDDING_MODEL=text-embedding-004
```

## Étape 4: Générer les Embeddings pour les Produits Existants

Pour vectoriser vos produits existants :

1. Ouvrez votre application
2. Utilisez l'assistant vocal avec la commande :
   ```
   "Régénère les embeddings pour tous les produits"
   ```
3. Ou pour un produit spécifique :
   ```
   "Régénère l'embedding pour le produit avec le code-barres XYZ"
   ```

## Fonctionnalités

### 1. Recherche Sémantique

La recherche sémantique comprend le sens de votre requête, pas seulement les mots.

**Exemples de requêtes :**
- "Trouve les boissons gazeuses"
- "Montre les produits sucrés"
- "Quels sont les articles de la catégorie snacks ?"

**Utilisation via l'assistant vocal :**
```
"Recherche sémantique de boissons froides"
```

### 2. Génération Automatique d'Embeddings

Les embeddings sont générés automatiquement :
- Lors de la création d'un nouveau produit
- Lors de la modification d'un produit existant

### 3. Outil de Régénération

Si vous avez besoin de recalculer les embeddings (après un changement de modèle, par exemple) :

```
"Régénère tous les embeddings"
```

## Architecture Technique

### Fichiers Clés

| Fichier | Description |
|---------|-------------|
| `src/lib/embeddingService.ts` | Service de génération et de comparaison d'embeddings |
| `src/types.ts` | Types mis à jour avec le champ `embedding` |
| `src/lib/supabaseInventory.ts` | Gestion de la persistance des embeddings |
| `src/components/GeminiAssistant/tools.ts` | Outils pour l'assistant vocal |
| `src/App.tsx` | Handlers des outils et intégration |
| `supabase/migrations/001_add_embedding_column.sql` | Migration de base de données |

### Fonction `generateProductEmbedding`

Prend un produit en entrée et retourne son embedding sous forme de tableau de nombres :

```typescript
import { generateProductEmbedding } from './lib/embeddingService';

const embedding = await generateProductEmbedding({
  name: 'Coca-Cola',
  brand: 'Coca-Cola Company',
  category: 'Boissons',
  purchasePrice: 1.20,
  salesPrice: 2.00,
});
```

### Fonction `fullSemanticSearch`

Recherche sémantique complète avec génération de l'embedding de la requête :

```typescript
const results = await fullSemanticSearch('boissons sucrées', inventory, 5);
// Retourne un tableau de { product: InventoryItem, similarity: number }
```

## Modèles d'Embedding Gemini Disponibles

| Modèle | Dimensions | Description |
|--------|------------|-------------|
| `text-embedding-004` | 768 | Modèle recommandé pour la plupart des cas d'usage |
| `text-embedding-003` | 768 | Version précédente, toujours disponible |
| `text-multilingual-embedding-002` | 768 | Optimisé pour le multilingue |

## Performances

- **Génération d'embedding :** ~100-300ms par produit (dépend de la latence API)
- **Recherche sémantique :** 
  - Côté client (petit catalogue) : instantané
  - Côté serveur (pgvector) : < 100ms pour 10k produits
- **Indexation :** L'index IVFFlat est utilisé pour accélérer les requêtes

## Troubleshooting

### Problème: L'extension pgvector ne s'active pas

Vérifiez que vous utilisez une version de PostgreSQL ≥ 12 dans Supabase.

### Problème: Erreur lors de la génération d'embeddings

Vérifiez :
1. Votre clé API Gemini est valide
2. Vous n'avez pas dépassé les quotas de l'API
3. La variable d'environnement `VITE_GEMINI_API_KEY` est correctement définie

### Problème: La recherche sémantique ne renvoie pas de résultats

Vérifiez :
1. Les embeddings ont bien été générés pour vos produits
2. La requête est en français (ou la langue configurée)
3. Vous avez au moins 1 produit avec un embedding

## Bonnes Pratiques

1. **Générez les embeddings en arrière-plan** : Pour de grands catalogues, utilisez un job cron ou une fonction Edge Supabase
2. **Mettez à jour les embeddings** : Lorsque vous modifiez le nom, la marque ou la catégorie d'un produit
3. **Utilisez la recherche sémantique** : Complétez la recherche par mots-clés avec la recherche sémantique pour de meilleurs résultats
4. **Monitorer les coûts** : Les API Gemini ont des quotas, surveillez votre consommation

## Améliorations Futures

- [ ] Utiliser des fonctions Edge Supabase pour générer les embeddings côté serveur
- [ ] Ajouter un cache pour les embeddings des requêtes fréquentes
- [ ] Support pour l'embedding d'images (multimodal)
- [ ] Ajustement automatique des poids des champs (ex: nom plus important que la catégorie)

## Support

Pour toute question, consultez la documentation :
- [Gemini Embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- [pgvector](https://github.com/pgvector/pgvector)
- [Supabase pgvector](https://supabase.com/docs/guides/database/extensions/pgvector)
