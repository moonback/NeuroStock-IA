# 🎤 Gestion Multi-Actions et Listes Vocales

## 📋 Vue d'ensemble

Cette fonctionnalité permet d'exécuter plusieurs actions en une seule commande vocale, offrant un gain de temps massif pour les tâches répétitives de gestion d'inventaire.

## 🆕 Nouvelles Commandes Vocales

### 1. 💰 Modification Multiple de Prix (Batch)

Mettez à jour plusieurs prix de vente ou d'achat en une seule commande.

**Exemples de commandes :**
```
"Mets le Coca à 1.80, le Fanta à 1.60 et le Sprite à 1.70"
"Change les prix : Coca 1.80, Fanta 1.60, Sprite 1.70"
"Fixe le prix d'achat du lait à 0.90 et du pain à 0.50"
```

**Fonctionnement :**
- L'assistant identifie automatiquement chaque produit mentionné
- Applique les nouveaux prix de manière séquentielle
- Confirme chaque modification ou signale les erreurs
- Si un prix dépasse ±50% du prix actuel, une confirmation est demandée

**Cas d'erreur gérés :**
- Produit non trouvé → signalé individuellement
- Produit ambigu → demande de précision
- Prix invalide → ignoré avec notification

---

### 2. 📦 Inventaire par Catégorie

Obtenez un rapport complet de tous les produits d'une catégorie spécifique.

**Exemples de commandes :**
```
"Fais l'inventaire des boissons"
"Montre-moi tous les snacks"
"Liste les produits de la catégorie fruits et légumes"
"Donne-moi le détail des produits laitiers"
```

**Informations retournées :**
- Nombre total de produits dans la catégorie
- Stock total (unités)
- Valeur totale d'achat
- Liste détaillée : nom, marque, quantité, prix

**Options :**
- Par défaut, inclut les produits en rupture
- Possibilité d'exclure les produits à stock zéro

---

### 3. 🚨 Liste des Produits en Rupture

Identifiez rapidement tous les produits qui nécessitent un réapprovisionnement.

**Exemples de commandes :**
```
"Quels produits sont en rupture ?"
"Qu'est-ce qui manque ?"
"Liste les ruptures"
"Qu'est-ce qui manque dans les boissons ?"
"Montre-moi les produits épuisés"
```

**Fonctionnalités :**
- Liste tous les produits avec quantité = 0
- Filtrage optionnel par catégorie
- Affichage du nombre total de ruptures
- Détails de chaque produit (nom, marque, catégorie, prix)

**Cas d'usage :**
- Préparation de commandes fournisseurs
- Audit rapide de stock
- Priorisation des réapprovisionnements

---

### 4. ⚠️ Liste des Produits en Stock Faible

Anticipez les ruptures en surveillant les produits dont le stock descend sous un seuil.

**Exemples de commandes :**
```
"Quels produits ont un stock faible ?"
"Qu'est-ce qui descend sous 5 ?"
"Liste les produits bientôt épuisés"
"Montre-moi les snacks qui descendent sous 10"
"Quels produits sont à moins de 3 unités ?"
```

**Paramètres configurables :**
- **Seuil par défaut** : 5 unités
- **Seuil personnalisé** : spécifiez un nombre différent
- **Filtre catégorie** : limitez à une catégorie spécifique
- **Exclure ruptures** : option pour ne voir que les produits en stock faible (>0)

**Informations retournées :**
- Nombre de produits concernés
- Seuil utilisé
- Catégorie filtrée (si applicable)
- Liste détaillée avec quantité exacte de chaque produit

---

## 🔄 Commandes Multi-Étapes

L'assistant peut maintenant gérer plusieurs actions dans une seule phrase.

**Exemples de workflows complexes :**

### Analyse complète d'une catégorie
```
"Fais l'inventaire des boissons et dis-moi ce qui manque"
```
→ 1. Obtient l'inventaire complet de la catégorie
→ 2. Identifie les produits en rupture dans cette catégorie
→ 3. Fournit un résumé vocal concis

### Audit de stock et alertes
```
"Montre-moi les ruptures et les produits en stock faible"
```
→ 1. Liste les produits à quantité 0
→ 2. Liste les produits avec quantité ≤ 5
→ 3. Résume le nombre total d'alertes

### Modification de prix groupée avec contexte
```
"Cherche tous les produits de la catégorie snacks et mets leurs prix à 2 euros"
```
→ 1. Recherche tous les snacks
→ 2. Applique le même prix à chaque produit trouvé
→ 3. Confirme le nombre de modifications effectuées

---

## 🎯 Avantages et Gains de Temps

| Tâche | Avant | Maintenant |
|-------|-------|------------|
| Modifier 5 prix | 5 commandes séparées | 1 seule commande |
| Vérifier ruptures par catégorie | Navigation manuelle + recherche | 1 commande vocale |
| Identifier produits à commander | Parcourir tout l'inventaire | 1 commande vocale |
| Préparer commande fournisseur | Notes manuelles | Liste automatique |

**Gain estimé** : **70% de réduction du temps** pour les tâches répétitives d'inventaire

---

## 🛡️ Gestion des Erreurs et Sécurité

### Confirmations intelligentes
- **Modifications de prix importantes** (±50%) : confirmation demandée
- **Actions multiples** : chaque action est confirmée individuellement si `autoAccept` est désactivé
- **Produits ambigus** : l'assistant demande une précision avant d'agir

### Traitement robuste
- Si une action échoue dans un batch, les autres continuent
- Chaque résultat est reporté individuellement (succès/échec)
- Logs détaillés pour debugging

### Rollback
- Toutes les modifications sont synchronisées avec la base de données
- Les modifications peuvent être annulées manuellement via l'interface

---

## 💡 Conseils d'Utilisation

### Pour de meilleurs résultats :

1. **Soyez précis dans les noms de produits**
   - ✅ "Mets le Coca-Cola 33cl à 1.80"
   - ⚠️ "Mets le Coca à 1.80" (peut être ambigu si plusieurs Coca)

2. **Utilisez les catégories exactes**
   - Vérifiez les noms de catégories dans votre système
   - L'assistant accepte les variations (majuscules, accents)

3. **Combinez les commandes logiquement**
   - ✅ "Inventaire des boissons et liste les ruptures"
   - ❌ "Modifie 50 prix" (trop long, risque d'erreur vocale)

4. **Profitez de la mémoire contextuelle**
   - "Cherche le Coca" puis "Mets son prix à 1.80"
   - L'assistant se souvient du dernier produit

---

## 🔧 Configuration Technique

### Tools ajoutés

| Tool | Description | Sensible |
|------|-------------|----------|
| `batchUpdatePrices` | Modification multiple de prix | ✅ Oui |
| `getCategoryInventory` | Inventaire par catégorie | ❌ Non |
| `getOutOfStockList` | Liste des ruptures | ❌ Non |
| `getLowStockList` | Liste stock faible | ❌ Non |

### Paramètres système

```typescript
// Seuil par défaut pour stock faible
DEFAULT_LOW_STOCK_THRESHOLD = 5

// Seuil de confirmation pour changement de prix
PRICE_CHANGE_THRESHOLD = 50% // ±50% du prix actuel
```

---

## 📊 Exemples de Scénarios Réels

### Scénario 1 : Début de journée
```
Utilisateur: "Bonjour Lina, quels produits sont en rupture ?"
Lina: "Il y a 3 produits en rupture : Coca-Cola 33cl, Pain de mie, et Lait demi-écrémé."

Utilisateur: "Et lesquels sont bientôt épuisés ?"
Lina: "7 produits ont un stock faible : Fanta 33cl (3 unités), Sprite 33cl (2 unités), 
       Chips Lay's (4 unités)... veux-tu la liste complète ?"
```

### Scénario 2 : Réception de commande
```
Utilisateur: "J'ai reçu la commande de boissons, mets le Coca à 1.80, 
             le Fanta à 1.60, le Sprite à 1.70 et l'Oasis à 2.20"
Lina: "Prix mis à jour : Coca-Cola 33cl à 1,80 €, Fanta Orange 33cl à 1,60 €, 
       Sprite 33cl à 1,70 €, Oasis Tropical 2L à 2,20 €. C'est tout ?"
```

### Scénario 3 : Audit de catégorie
```
Utilisateur: "Fais l'inventaire des snacks et dis-moi ce qui manque"
Lina: "Catégorie snacks : 24 produits, 156 unités en stock, valeur totale 234,50 €. 
       Ruptures : Chips Lay's Paprika, Twix, et M&M's. Stock faible : Snickers (2), 
       KitKat (3)."
```

---

## 🚀 Évolutions Futures Possibles

- **Export automatique** des listes de rupture en PDF ou CSV
- **Intégration commandes fournisseurs** : création automatique de bons de commande
- **Alertes proactives** : Lina prévient automatiquement en début de journée
- **Suggestions intelligentes** : prix optimaux basés sur l'historique
- **Analyse de tendances** : produits qui descendent rapidement en stock

---

## 📞 Support

Pour toute question ou suggestion d'amélioration sur cette fonctionnalité, 
consultez la documentation principale ou contactez l'équipe de développement.

**Version** : 1.0.0  
**Date de création** : Juillet 2026  
**Dernière mise à jour** : Juillet 2026
