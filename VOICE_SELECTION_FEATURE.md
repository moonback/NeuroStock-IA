# Fonctionnalité : Sélection de la voix de l'assistant vocal

## Résumé
Cette fonctionnalité permet aux utilisateurs de choisir parmi 5 voix différentes pour l'assistant vocal dans l'onglet Paramètres.

## Voix disponibles
Les voix suivantes sont proposées via l'API Gemini Live :
- **Puck** (voix par défaut)
- **Charon**
- **Kore**
- **Fenrir**
- **Aoede**

## Fichiers modifiés

### 1. `src/App.tsx`
- Ajout d'un état `assistantVoice` et `isAssistantVoiceLoaded`
- Chargement de la voix depuis la base de données ou localStorage (par défaut: "Puck")
- Sauvegarde automatique de la voix sélectionnée dans localStorage et Supabase
- Passage de la prop `assistantVoice` au `GeminiAssistantProvider` et au `SettingsTab`

### 2. `src/components/app/SettingsTab.tsx`
- Ajout de la prop `assistantVoice` et `onAssistantVoiceChange`
- Ajout d'une constante `VOICE_OPTIONS` avec les 5 voix disponibles
- Création d'une nouvelle section dans l'interface avec un sélecteur de voix (dropdown)
- Mise à jour automatique lors du changement de sélection

### 3. `src/providers/GeminiAssistantProvider.tsx`
- Ajout de la prop `assistantVoice` avec valeur par défaut "Puck"
- Passage de la voix à la méthode `connect()` de `LiveSession`
- Ajout de `assistantVoice` dans les dépendances du `useCallback`

### 4. `src/components/GeminiAssistant/types.ts`
- Ajout de `assistantVoice?: string` à l'interface `GeminiAssistantProviderProps`

### 5. `src/components/GeminiAssistant/LiveSession.ts`
- Ajout de champs privés `currentVoice` et `currentContext` pour mémoriser la configuration
- Modification de la méthode `connect()` pour accepter un paramètre `voice`
- Ajout de `speechConfig` dans la configuration de l'API Gemini Live
- Mise à jour de `handleClose()` pour utiliser la voix mémorisée lors de la reconnexion

## Base de données
La table `app_settings` existante est utilisée pour stocker la préférence :
- **Clé** : `assistant_voice`
- **Valeur** : L'une des 5 voix disponibles

## Utilisation
1. Ouvrir l'application
2. Naviguer vers l'onglet "Paramètres"
3. Trouver la section "Voix de l'assistant"
4. Sélectionner une voix dans la liste déroulante
5. La voix est automatiquement sauvegardée et sera utilisée immédiatement pour les nouvelles sessions vocales

## Remarques techniques
- La sélection de voix est sauvegardée localement (localStorage) et dans la base de données (Supabase)
- La voix est appliquée lors de la connexion à l'API Gemini Live
- En cas de reconnexion automatique, la voix sélectionnée est préservée
- La voix par défaut est "Puck" conformément à la documentation de l'API Gemini Live
