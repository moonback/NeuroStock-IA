# 🎤 Fonctionnalités Multi-Actions Vocales - Guide Complet

## 📖 Table des Matières

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Fonctionnalités](#fonctionnalités)
4. [Utilisation](#utilisation)
5. [Tests](#tests)
6. [Architecture](#architecture)
7. [Dépannage](#dépannage)
8. [FAQ](#faq)

---

## 🎯 Introduction

Cette extension ajoute à l'assistant vocal **Lina** la capacité d'exécuter **plusieurs actions en une seule commande vocale**, permettant un gain de temps massif pour les tâches répétitives de gestion d'inventaire.

### Problème Résolu

**Avant :**
- 5 commandes vocales pour modifier 5 prix
- Navigation manuelle pour voir les ruptures par catégorie
- Parcourir tout l'inventaire pour identifier les produits à commander
- Prendre des notes manuelles pour préparer les commandes fournisseurs

**Après :**
- 1 seule commande pour modifier 5 prix
- 1 commande vocale pour les ruptures d'une catégorie
- 1 commande vocale pour les produits à commander
- Liste automatique prête à l'emploi

### Gain Estimé

**70% de réduction du temps** pour les tâches répétitives d'inventaire.

---

## 🚀 Installation

### Pré-requis

- ✅ Application NeuroStock fonctionnelle
- ✅ Node.js >= 18.x
- ✅ npm ou yarn
- ✅ Accès à l'API Gemini Live

### Étapes d'Installation

Les nouveaux fichiers ont été automatiquement intégrés. Aucune action supplémentaire requise.

**Vérification :**
```bash
# Vérifier que l'application compile
npm run build

# Lancer l'application en dev
npm run dev
```

Si tout fonctionne, vous êtes prêt ! 🎉

---

## 🌟 Fonctionnalités

### 1. 💰 Modification Multiple de Prix

Mettez à jour plusieurs prix en une seule commande.

**Commandes :**
```
"Mets le Coca à 1.80, le Fanta à 1.60 et le Sprite à 1.70"
```

**Avantages :**
- ✅ Gain de temps : 1 commande au lieu de N
- ✅ Gestion d'erreurs individuelle
- ✅ Confirmation automatique pour gros changements

---

### 2. 📦 Inventaire par Catégorie

Obtenez un rapport complet d'une catégorie.

**Commandes :**
```
"Fais l'inventaire des boissons"
```

**Informations fournies :**
- Nombre de produits
- Stock total
- Valeur totale
- Détail des produits

---

### 3. 🚨 Liste des Ruptures

Identifiez les produits en rupture de stock.

**Commandes :**
```
"Quels produits sont en rupture ?"
"Qu'est-ce qui manque dans les boissons ?"
```

**Filtres disponibles :**
- Toutes catégories
- Par catégorie spécifique

---

### 4. ⚠️ Liste Stock Faible

Anticipez les ruptures.

**Commandes :**
```
"Quels produits ont un stock faible ?"
"Liste les snacks qui descendent sous 10"
```

**Options :**
- Seuil personnalisable (défaut : 5)
- Filtre par catégorie
- Exclure les ruptures

---

## 📚 Utilisation

### Démarrer l'Assistant

1. Ouvrez l'application NeuroStock
2. Cliquez sur l'icône de Lina (micro)
3. Attendez "Bonjour, demande comment je peux t'aider !"
4. Commencez à parler

### Exemples de Workflows

#### Workflow 1 : Réception de Commande Fournisseur

```
Vous: "Mets le Coca à 1.80, le Fanta à 1.60 et le Sprite à 1.70"
Lina: "Prix mis à jour : Coca-Cola à 1,80 €, Fanta à 1,60 €, Sprite à 1,70 €"
```

#### Workflow 2 : Audit de Stock Matinal

```
Vous: "Quels produits sont en rupture ?"
Lina: "3 produits en rupture : Coca-Cola, Pain, Lait"

Vous: "Et lesquels sont bientôt épuisés ?"
Lina: "7 produits en stock faible : Fanta (3), Sprite (2)..."
```

#### Workflow 3 : Analyse par Catégorie

```
Vous: "Fais l'inventaire des boissons et dis-moi ce qui manque"
Lina: "Catégorie boissons : 24 produits, 156 unités. Ruptures : Coca-Cola"
```

---

## 🧪 Tests

### Tests Manuels Rapides

#### Test 1 : Modification de Prix
```
1. Dites : "Mets le Coca à 2 euros"
2. Vérifiez que le prix a changé dans la page Stock
3. ✅ Pass si le prix est à 2,00 €
```

#### Test 2 : Liste Ruptures
```
1. Mettez un produit à quantité 0
2. Dites : "Quels produits sont en rupture ?"
3. ✅ Pass si le produit est listé
```

#### Test 3 : Inventaire Catégorie
```
1. Dites : "Fais l'inventaire des [votre catégorie]"
2. ✅ Pass si Lina donne le nombre de produits
```

### Tests Complets

Consultez **[TEST_MULTI_ACTIONS.md](./TEST_MULTI_ACTIONS.md)** pour :
- 15+ scénarios de test détaillés
- Checklist de validation complète
- Guide de rapport de bug

---

## 🏗️ Architecture

### Structure des Fichiers

```
src/
├── components/
│   └── GeminiAssistant/
│       ├── tools.ts              ← 4 nouveaux tools ajoutés
│       ├── systemPrompt.ts       ← Instructions étendues
│       ├── types.ts              ← 12 nouveaux types
│       └── multiActionsExamples.ts  ← Exemples de tests
├── App.tsx                       ← 4 nouveaux handlers ajoutés
└── ...

docs/
├── MULTI_ACTIONS_VOCALES.md      ← Documentation utilisateur
├── TEST_MULTI_ACTIONS.md         ← Guide de test
├── CHANGELOG_MULTI_ACTIONS.md    ← Historique des changements
└── README_MULTI_ACTIONS.md       ← Ce fichier
```

### Nouveaux Tools

| Tool | Description | Sensible |
|------|-------------|----------|
| `batchUpdatePrices` | Modification multiple de prix | ✅ |
| `getCategoryInventory` | Inventaire par catégorie | ❌ |
| `getOutOfStockList` | Liste des ruptures | ❌ |
| `getLowStockList` | Liste stock faible | ❌ |

### Flux de Données

```
┌─────────────┐
│   Vocal     │
│  (Gemini)   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  systemPrompt   │ ← Instructions pour Lina
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│    Tool Call    │ ← Ex: batchUpdatePrices
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Tool Handler   │ ← Logique dans App.tsx
│  (App.tsx)      │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   Database      │ ← Supabase ou Local
│   Sync          │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│   UI Update     │ ← React state update
└─────────────────┘
```

---

## 🔧 Dépannage

### Problème 1 : Lina ne comprend pas ma commande

**Symptômes :**
- Lina dit "Je n'ai pas compris"
- Aucun tool n'est appelé

**Solutions :**
1. Vérifiez votre prononciation
2. Essayez de reformuler différemment
3. Vérifiez que le produit existe dans l'inventaire
4. Consultez les exemples dans `MULTI_ACTIONS_VOCALES.md`

---

### Problème 2 : Produit non trouvé alors qu'il existe

**Symptômes :**
- Lina dit "Produit non trouvé"
- Le produit existe dans la page Stock

**Solutions :**
1. Essayez d'utiliser le code-barres : "Mets le code-barres 123456 à 2 euros"
2. Ajoutez la marque : "Mets le Coca-Cola de Coca-Cola à 2 euros"
3. Vérifiez les fautes de frappe dans le nom du produit
4. Utilisez la recherche sémantique : "Cherche Coca"

---

### Problème 3 : Prix ne se met pas à jour

**Symptômes :**
- Lina confirme la mise à jour
- Le prix ne change pas dans l'interface

**Solutions :**
1. Rafraîchissez la page (F5)
2. Vérifiez la console développeur (F12) pour les erreurs
3. Vérifiez la connexion réseau si mode online
4. Vérifiez les logs de synchronisation

---

### Problème 4 : Liste vide alors qu'il y a des ruptures

**Symptômes :**
- Lina dit "Aucun produit en rupture"
- Vous savez qu'il y en a

**Solutions :**
1. Vérifiez que les quantités sont bien à 0 (pas juste faibles)
2. Vérifiez le filtre catégorie si vous en avez spécifié un
3. Essayez sans filtre : "Quels produits sont en rupture ?"

---

### Logs et Debugging

**Activer les logs détaillés :**
```javascript
// Dans la console développeur (F12)
localStorage.setItem('assistantDebug', 'true');
```

**Consulter les logs :**
```javascript
// Dans la console développeur
// Tous les tool calls sont loggés avec [assistant][toolName]
```

---

## ❓ FAQ

### Q1 : Combien de prix puis-je modifier en une seule commande ?

**R :** Théoriquement illimité, mais pour une meilleure fiabilité vocale, nous recommandons **3-5 prix maximum** par commande. Au-delà, découpez en plusieurs commandes.

---

### Q2 : Puis-je modifier à la fois le prix d'achat ET de vente ?

**R :** Oui ! Exemple :
```
"Mets le prix d'achat du Coca à 1.20 et son prix de vente à 1.80"
```

---

### Q3 : Comment annuler une modification de prix ?

**R :** 
- **Avant confirmation :** Dites "Annule" ou "Laisse tomber"
- **Après confirmation :** Modifiez manuellement ou dites "Remets le Coca à [ancien prix]"

---

### Q4 : Les listes peuvent-elles être exportées ?

**R :** Pas encore dans cette version. Prévu pour la version 1.1.0.

En attendant, vous pouvez :
1. Dire "Quels produits sont en rupture ?"
2. Noter manuellement les produits cités
3. Ou consulter la page Stock et filtrer manuellement

---

### Q5 : La recherche est-elle sensible à la casse ?

**R :** Non. "COCA", "Coca", "coca" fonctionnent tous de la même manière.

---

### Q6 : Puis-je utiliser des abréviations ?

**R :** Partiellement. Les abréviations courantes fonctionnent :
- ✅ "Coca" pour "Coca-Cola"
- ✅ "Evian" pour "Evian 1.5L"
- ⚠️ "CL" pour "Coca Light" → peut être ambigu

---

### Q7 : Combien de produits Lina cite-t-elle dans une liste ?

**R :** Pour rester concis et vocal, Lina cite **2-3 produits maximum** puis dit "et X autres". Pour la liste complète, consultez l'interface ou demandez à Lina de préciser.

---

### Q8 : Les modifications sont-elles sauvegardées immédiatement ?

**R :** Oui. Toutes les modifications sont :
1. Appliquées immédiatement à l'état local
2. Synchronisées avec la base de données (Supabase ou local)
3. Persistées même si vous fermez l'application

---

### Q9 : Puis-je utiliser ces fonctionnalités en mode hors ligne ?

**R :** Oui pour :
- ✅ Modification de prix
- ✅ Inventaire par catégorie
- ✅ Listes de ruptures et stock faible

Non pour :
- ❌ Recherche sémantique avancée (nécessite réseau)

---

### Q10 : Comment activer/désactiver les confirmations automatiques ?

**R :** 
1. Ouvrez l'assistant Lina
2. Cliquez sur l'icône paramètres (engrenage)
3. Cochez/décochez "Acceptation automatique"

Avec confirmation désactivée, Lina demandera avant chaque action sensible.

---

## 📞 Support et Contact

### Rapporter un Bug

1. Vérifiez la section [Dépannage](#dépannage)
2. Consultez la [FAQ](#faq)
3. Si non résolu, créez un rapport avec :
   - Commande vocale exacte
   - Comportement attendu vs observé
   - Logs de la console (F12)
   - État de l'inventaire au moment du test

### Suggérer une Amélioration

Nous sommes ouverts aux suggestions ! Partagez vos idées pour :
- Nouvelles commandes vocales
- Optimisations de performance
- Améliorations de l'expérience utilisateur

---

## 📖 Documentation Complète

- **[MULTI_ACTIONS_VOCALES.md](./MULTI_ACTIONS_VOCALES.md)** - Documentation utilisateur détaillée
- **[TEST_MULTI_ACTIONS.md](./TEST_MULTI_ACTIONS.md)** - Guide de test complet
- **[CHANGELOG_MULTI_ACTIONS.md](./CHANGELOG_MULTI_ACTIONS.md)** - Historique des versions
- **[multiActionsExamples.ts](./src/components/GeminiAssistant/multiActionsExamples.ts)** - Exemples de code

---

## 🎓 Tutoriel Vidéo

*(Prévu pour la prochaine version)*

En attendant, suivez les exemples du fichier **MULTI_ACTIONS_VOCALES.md**.

---

## 🌟 Crédits

**Développé par :** [Votre Nom]  
**Version :** 1.0.0  
**Date :** Juillet 2026  
**License :** MIT (ou celle de votre projet)

---

## 🚀 Prochaines Étapes

Maintenant que vous avez installé et compris les fonctionnalités :

1. ✅ **Testez les 4 fonctionnalités** (voir [Tests](#tests))
2. ✅ **Créez vos propres workflows** adaptés à votre boutique
3. ✅ **Partagez vos retours** pour améliorer l'assistant
4. ✅ **Explorez la roadmap** (voir CHANGELOG_MULTI_ACTIONS.md)

**Profitez de Lina et gagnez du temps ! 🎉**

---

*Dernière mise à jour : Juillet 2026*
