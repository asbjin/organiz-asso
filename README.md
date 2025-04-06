# Organiz'asso

Plateforme d'échange de messages pour une association. Cette application utilise la stack MERN (MongoDB, Express, React, Node.js) et offre des fonctionnalités de forum, de messagerie en temps réel et de gestion d'utilisateurs.

## Fonctionnalités

- **Forums** : Création et participation à des forums thématiques
- **Messagerie en temps réel** : Communication instantanée via WebSockets
- **Gestion des utilisateurs** : Inscription, validation et gestion des rôles
- **Interface responsive** : Compatible mobile et desktop

## Prérequis

- Node.js (v14 ou supérieur)
- MongoDB
- npm ou yarn

## Installation locale

1. Cloner le dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/organiz-asso.git
   cd organiz-asso
   ```

2. Installer les dépendances :
   ```bash
   npm run install-all
   ```

3. Configurer les variables d'environnement :
   - Copier les fichiers `.env.example` vers `.env` dans les dossiers racine, `/backend` et `/frontend`
   - Ajuster les valeurs selon votre environnement

4. Démarrer l'application en mode développement :
   ```bash
   npm run dev
   ```

## Déploiement sur Render.com

### Méthode 1: Déploiement automatique avec le fichier render.yaml

1. Créer un compte sur [Render.com](https://render.com)
2. Connecter votre compte GitHub à Render
3. Dans le tableau de bord Render, cliquer sur "New Blueprint" et sélectionner votre dépôt
4. Render détectera automatiquement le fichier `render.yaml` et configurera les services
5. Cliquer sur "Apply Blueprint" pour lancer le déploiement

### Méthode 2: Déploiement manuel

#### Configurer la base de données

1. Dans le tableau de bord Render, aller à "New" > "MongoDB"
2. Créer une nouvelle base de données MongoDB avec le plan gratuit
3. Notez l'URL de connexion qui sera utilisée pour les services backend

#### Déployer le backend

1. Dans le tableau de bord Render, aller à "New" > "Web Service"
2. Connecter votre dépôt GitHub
3. Configurer le service :
   - **Name**: organiz-asso-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Root Directory**: `backend`
4. Ajouter les variables d'environnement :
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `MONGODB_URI`: l'URL de connexion MongoDB
   - `SESSION_SECRET`: une chaîne aléatoire pour sécuriser les sessions
   - `JWT_SECRET`: une chaîne aléatoire pour les tokens JWT
   - `CLIENT_URL`: l'URL de votre frontend (à remplir après avoir déployé le frontend)

#### Déployer le frontend

1. Dans le tableau de bord Render, aller à "New" > "Static Site"
2. Connecter votre dépôt GitHub
3. Configurer le service :
   - **Name**: organiz-asso-web
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
   - **Root Directory**: `frontend`
4. Ajouter les variables d'environnement :
   - `REACT_APP_API_URL`: l'URL de votre backend déployé (ex: https://organiz-asso-api.onrender.com)
   - `REACT_APP_WS_URL`: la même URL que votre backend

5. Retourner aux paramètres du backend et mettre à jour `CLIENT_URL` avec l'URL de votre frontend déployé

## Utiliser un nom de domaine personnalisé

### Option 1: Sous-domaine gratuit Render

Votre application sera disponible sur :
- Frontend: https://organiz-asso-web.onrender.com
- Backend: https://organiz-asso-api.onrender.com

### Option 2: Domaine personnalisé

1. Acheter un nom de domaine chez un registrar (Namecheap, OVH, etc.)
2. Dans les paramètres de votre service frontend sur Render, aller à "Custom Domains"
3. Ajouter votre domaine et suivre les instructions pour configurer les DNS
4. (Optionnel) Configurer un sous-domaine pour l'API (ex: api.votre-domaine.com)

### Option 3: Domaine gratuit Freenom

1. Créer un compte sur [Freenom](https://www.freenom.com)
2. Rechercher un domaine disponible en .tk, .ml, .ga, .cf ou .gq
3. Enregistrer le domaine gratuitement (jusqu'à 12 mois)
4. Dans les paramètres de votre service frontend sur Render, configurer le domaine personnalisé
5. Configurer les DNS selon les instructions de Render

## Licence

MIT

## Auteurs

Développé dans le cadre du cours 3IN017 - Technologies du Web
