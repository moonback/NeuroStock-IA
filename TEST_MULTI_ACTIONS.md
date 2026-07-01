# 🧪 Guide de Test - Fonctionnalités Multi-Actions Vocales

## 🎯 Objectif

Ce guide vous aide à tester les nouvelles fonctionnalités multi-actions de l'assistant vocal Lina.

---

## 📋 Pré-requis

Avant de commencer les tests, assurez-vous que :

- ✅ L'application est lancée et fonctionnelle
- ✅ Vous avez au moins 20 produits dans votre inventaire
- ✅ Certains produits sont en rupture (quantité = 0)
- ✅ Certains produits ont un stock faible (quantité ≤ 5)
- ✅ Vous avez plusieurs catégories avec plusieurs produits
- ✅ L'assistant vocal Lina est activé et connecté

---

## 🔧 Configuration de Test Recommandée

### Créer des Produits de Test

Pour tester efficacement, ajoutez des produits variés :

```
Catégorie "Boissons" :
- Coca-Cola 33cl (stock: 0) → RUPTURE
- Fanta Orange 33cl (stock: 3) → STOCK FAIBLE
- Sprite 33cl (stock: 2) → STOCK FAIBLE
- Oasis Tropical 2L (stock: 15) → OK
- Evian 1.5L (stock: 20) → OK

Catégorie "Snacks" :
- Chips Lay's Paprika (stock: 0) → RUPTURE
- Twix (stock: 0) → RUPTURE
- M&M's (stock: 4) → STOCK FAIBLE
- Snickers (stock: 2) → STOCK FAIBLE
- KitKat (stock: 3) → STOCK FAIBLE
- Haribo (stock: 12) → OK

Catégorie "Produits frais" :
- Lait demi-écrémé (stock: 0) → RUPTURE
- Pain de mie (stock: 5) → STOCK FAIBLE
- Beurre (stock: 8) → OK
```

---

## 📝 Tests par Fonctionnalité

### Test 1️⃣ : Modification Multiple de Prix

#### Test 1.1 - Succès complet
**Commande vocale :**
```
"Mets le Coca à 1.80, le Fanta à 1.60 et le Sprite à 1.70"
```

**Résultat attendu :**
- ✅ Tool `batchUpdatePrices` appelé
- ✅ 3 produits mis à jour
- ✅ Confirmation vocale : "Prix mis à jour : Coca-Cola à 1,80 €, Fanta à 1,60 €, Sprite à 1,70 €"
- ✅ Les prix sont effectivement modifiés dans l'inventaire

**Vérification :**
1. Ouvrez la page Stock
2. Vérifiez que les 3 produits ont les nouveaux prix
3. Vérifiez que `lastUpdated` a été mis à jour

---

#### Test 1.2 - Produit non trouvé
**Commande vocale :**
```
"Mets le Coca à 1.80, le ProduitInexistant à 2.00 et le Fanta à 1.60"
```

**Résultat attendu :**
- ✅ Tool `batchUpdatePrices` appelé
- ✅ 2 produits mis à jour (Coca, Fanta)
- ✅ 1 produit non trouvé (ProduitInexistant)
- ✅ Réponse vocale : "J'ai mis à jour Coca et Fanta, mais je n'ai pas trouvé ProduitInexistant"

---

#### Test 1.3 - Confirmation pour gros changement de prix
**Commande vocale :**
```
"Mets le Coca à 10 euros"
```

**Résultat attendu :**
- ✅ Lina demande confirmation : "Le prix de Coca va passer de 1,80 € à 10,00 €, c'est une augmentation de plus de 50%. Tu confirmes ?"
- ✅ Attendre confirmation avant de modifier

---

### Test 2️⃣ : Inventaire par Catégorie

#### Test 2.1 - Catégorie avec produits
**Commande vocale :**
```
"Fais l'inventaire des boissons"
```

**Résultat attendu :**
- ✅ Tool `getCategoryInventory` appelé avec `categoryName: "boissons"`
- ✅ Réponse vocale résume : nombre de produits, stock total, valeur
- ✅ Exemple : "Catégorie boissons : 5 produits, 40 unités en stock, valeur totale 45,50 €"
- ✅ Cite 2-3 exemples de produits

---

#### Test 2.2 - Catégorie vide
**Commande vocale :**
```
"Fais l'inventaire de la catégorie CategorieInexistante"
```

**Résultat attendu :**
- ✅ Tool `getCategoryInventory` appelé
- ✅ Réponse vocale : "Aucun produit dans la catégorie CategorieInexistante"

---

#### Test 2.3 - Catégorie avec variations de nom
**Commande vocale :**
```
"Montre-moi tous les SNACKS"
"Liste les produits snacks"
"Inventaire de la catégorie Snack"
```

**Résultat attendu :**
- ✅ Les 3 commandes doivent fonctionner (insensible à la casse)
- ✅ Toutes retournent les produits de la catégorie "Snacks"

---

### Test 3️⃣ : Liste des Produits en Rupture

#### Test 3.1 - Toutes catégories
**Commande vocale :**
```
"Quels produits sont en rupture ?"
```

**Résultat attendu :**
- ✅ Tool `getOutOfStockList` appelé sans filtre
- ✅ Réponse vocale liste les ruptures : "3 produits en rupture : Coca-Cola, Chips Lay's, Lait demi-écrémé"
- ✅ Si plus de 3 ruptures, cite seulement les 2-3 premiers

---

#### Test 3.2 - Filtre par catégorie
**Commande vocale :**
```
"Qu'est-ce qui manque dans les boissons ?"
```

**Résultat attendu :**
- ✅ Tool `getOutOfStockList` appelé avec `categoryFilter: "boissons"`
- ✅ Seules les ruptures de la catégorie boissons sont listées
- ✅ Exemple : "1 produit en rupture dans les boissons : Coca-Cola"

---

#### Test 3.3 - Aucune rupture
**Prérequis :** Assurez-vous qu'aucun produit n'a une quantité = 0

**Commande vocale :**
```
"Montre-moi les produits épuisés"
```

**Résultat attendu :**
- ✅ Tool `getOutOfStockList` appelé
- ✅ Réponse vocale : "Aucun produit en rupture" ou "Tous les produits sont en stock"

---

### Test 4️⃣ : Liste des Produits en Stock Faible

#### Test 4.1 - Seuil par défaut (5)
**Commande vocale :**
```
"Quels produits ont un stock faible ?"
```

**Résultat attendu :**
- ✅ Tool `getLowStockList` appelé avec `threshold: 5`
- ✅ Liste tous les produits avec quantité ≤ 5 (incluant 0)
- ✅ Exemple : "7 produits ont un stock faible : Fanta (3), Sprite (2), M&M's (4)..."

---

#### Test 4.2 - Seuil personnalisé
**Commande vocale :**
```
"Liste les produits qui descendent sous 10"
```

**Résultat attendu :**
- ✅ Tool `getLowStockList` appelé avec `threshold: 10`
- ✅ Liste tous les produits avec quantité ≤ 10
- ✅ Plus de produits que le test 4.1

---

#### Test 4.3 - Filtre par catégorie
**Commande vocale :**
```
"Montre-moi les snacks qui descendent sous 5"
```

**Résultat attendu :**
- ✅ Tool `getLowStockList` appelé avec `threshold: 5` et `categoryFilter: "snacks"`
- ✅ Seuls les snacks avec stock ≤ 5 sont listés
- ✅ Exemple : "5 produits snacks en stock faible : M&M's (4), Snickers (2), KitKat (3)..."

---

#### Test 4.4 - Exclure les ruptures
**Commande vocale :**
```
"Quels produits sont bientôt épuisés sans les ruptures"
```

**Résultat attendu :**
- ✅ Tool `getLowStockList` appelé avec `excludeOutOfStock: true`
- ✅ Liste seulement les produits avec 0 < quantité ≤ 5
- ✅ Les produits à quantité = 0 ne sont PAS listés

---

### Test 5️⃣ : Commandes Multi-Étapes

#### Test 5.1 - Inventaire + Ruptures
**Commande vocale :**
```
"Fais l'inventaire des boissons et dis-moi ce qui manque"
```

**Résultat attendu :**
- ✅ **Étape 1** : Tool `getCategoryInventory` appelé avec `categoryName: "boissons"`
- ✅ **Étape 2** : Tool `getOutOfStockList` appelé avec `categoryFilter: "boissons"`
- ✅ Réponse vocale combine les deux : "Catégorie boissons : 5 produits, 40 unités. Ruptures : Coca-Cola"

---

#### Test 5.2 - Ruptures + Stock faible
**Commande vocale :**
```
"Montre-moi les ruptures et les produits en stock faible"
```

**Résultat attendu :**
- ✅ **Étape 1** : Tool `getOutOfStockList` appelé
- ✅ **Étape 2** : Tool `getLowStockList` appelé
- ✅ Réponse vocale : "3 produits en rupture, 7 produits en stock faible"

---

#### Test 5.3 - Commande complexe avec confirmation
**Commande vocale :**
```
"Cherche le Coca, puis mets son prix à 2 euros"
```

**Résultat attendu :**
- ✅ **Étape 1** : Tool `searchProduct` appelé avec `query: "Coca"`
- ✅ Lina mémorise le produit trouvé
- ✅ **Étape 2** : Tool `updateProduct` appelé avec le code-barres mémorisé et `salesPrice: 2.00`
- ✅ Réponse vocale : "Coca-Cola trouvé. Prix de vente mis à jour à 2,00 €"

---

## ✅ Checklist de Validation Complète

### Fonctionnalités de base
- [ ] Modification d'un seul prix fonctionne
- [ ] Modification de 3 prix en batch fonctionne
- [ ] Modification de 5+ prix en batch fonctionne
- [ ] Gestion d'erreur pour produit non trouvé
- [ ] Confirmation pour changement de prix > 50%

### Inventaire et listes
- [ ] Inventaire d'une catégorie avec produits
- [ ] Inventaire d'une catégorie vide
- [ ] Liste des ruptures (toutes catégories)
- [ ] Liste des ruptures (filtre catégorie)
- [ ] Liste stock faible (seuil par défaut)
- [ ] Liste stock faible (seuil personnalisé)
- [ ] Liste stock faible (filtre catégorie)
- [ ] Liste stock faible (exclure ruptures)

### Multi-actions
- [ ] Inventaire + ruptures dans une commande
- [ ] Ruptures + stock faible dans une commande
- [ ] Recherche + modification dans une commande

### Gestion d'erreurs
- [ ] Produit ambigu détecté et clarification demandée
- [ ] Produit inexistant géré correctement
- [ ] Catégorie inexistante gérée correctement
- [ ] Erreur réseau gérée gracieusement

### Expérience utilisateur
- [ ] Réponses vocales claires et concises
- [ ] Pas de répétition inutile
- [ ] Temps de réponse acceptable (<3 secondes)
- [ ] Confirmation demandée pour actions sensibles

---

## 🐛 Rapporter un Bug

Si vous rencontrez un problème pendant les tests :

1. **Notez la commande vocale exacte** utilisée
2. **Notez le comportement attendu** vs le comportement observé
3. **Vérifiez la console développeur** (F12) pour les erreurs
4. **Capturez les logs** de l'assistant (si disponibles)
5. **Notez l'état de l'inventaire** au moment du test

### Format de rapport de bug

```markdown
**Commande vocale :** "Mets le Coca à 1.80"
**Comportement attendu :** Prix mis à jour à 1.80 €
**Comportement observé :** Erreur "Produit non trouvé"
**État inventaire :** 50 produits, Coca-Cola existe avec code-barres 123456
**Console errors :** [Copier les erreurs]
**Timestamp :** 2026-07-01 14:30
```

---

## 📊 Métriques de Performance

Pendant les tests, surveillez :

| Métrique | Valeur cible | Valeur acceptable |
|----------|--------------|-------------------|
| Temps de réponse moyen | < 2 secondes | < 3 secondes |
| Taux de succès | > 95% | > 90% |
| Taux de produits trouvés | > 98% | > 95% |
| Faux positifs (ambigus) | < 3% | < 5% |

---

## 🎓 Conseils pour Tests Efficaces

1. **Testez dans des conditions réelles**
   - Utilisez des noms de produits réels de votre boutique
   - Testez dans un environnement bruyant (comme en magasin)

2. **Variez les formulations**
   - Essayez différentes façons de dire la même chose
   - Testez avec des fautes de prononciation volontaires

3. **Testez les cas limites**
   - Produits avec caractères spéciaux
   - Catégories avec espaces ou accents
   - Très longs noms de produits

4. **Testez la mémoire contextuelle**
   - Référez-vous au "dernier produit" sans le nommer
   - Enchaînez plusieurs commandes sur le même produit

---

## 🚀 Prochaines Étapes

Une fois tous les tests validés :

1. ✅ Documentez les bugs trouvés et corrigés
2. ✅ Mettez à jour la documentation utilisateur
3. ✅ Formez les utilisateurs finaux
4. ✅ Déployez en production
5. ✅ Collectez les retours utilisateurs

---

**Bonne chance pour vos tests ! 🎉**
