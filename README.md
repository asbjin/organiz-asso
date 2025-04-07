# Organiz-Asso

Plateforme d'échange de messages pour une association développée avec la stack MERN (MongoDB, Express, React, Node.js).

## Description

Organiz-Asso est une application web complète permettant aux membres d'une association de communiquer efficacement via des forums de discussion. La plateforme offre une interface moderne avec une recherche avancée, une gestion des utilisateurs et un système de messagerie.

## Fonctionnalités principales

- **Système d'authentification** : Inscription, connexion et gestion des profils utilisateurs
- **Forums de discussion** : Création et participation à des forums publics et privés
- **Messagerie** : Système complet pour l'échange de messages entre utilisateurs
- **Recherche avancée** : Recherche de messages, forums et utilisateurs avec interface à onglets
- **Gestion des permissions** : Différents niveaux d'accès (admin, utilisateur standard)
- **Interface responsive** : Adaptation à tous les appareils (desktop, mobile, tablette)
- **Temps réel** : Notifications et mises à jour avec Socket.io

## Prérequis

- Node.js (v18.0.0 ou supérieur)
- npm (v10.0.0 ou supérieur)
- MongoDB (v4.0.0 ou supérieur)

## Structure du projet

```
organiz-asso/
├── backend/           # Serveur Express, API REST
│   ├── controllers/   # Logique métier
│   ├── models/        # Modèles de données Mongoose
│   ├── routes/        # Points d'accès API
│   └── server.js      # Point d'entrée du backend
├── frontend/          # Application React
│   ├── public/        # Fichiers statiques
│   └── src/           # Code source React
│       ├── components/# Composants React
│       ├── pages/     # Pages de l'application
│       ├── redux/     # État global avec Redux
│       └── App.js     # Point d'entrée du frontend
└── package.json       # Dépendances et scripts npm
```

## Installation

1. Clonez le dépôt :
   ```
   git clone <URL-du-repo>
   cd organiz-asso
   ```

2. Installez les dépendances :
   ```
   npm run install-all
   ```

3. Configurez les variables d'environnement :
   - Créez un fichier `.env` dans le dossier `backend` avec les variables suivantes :
   ```
   PORT=5000
   MONGODB_URI=votre_uri_mongodb
   JWT_SECRET=votre_secret_jwt
   ```

4. Lancez l'application en mode développement :
   ```
   npm run dev
   ```

## Dépendances principales

### Backend
- **express** (v4.21.2) : Framework web pour Node.js
- **mongoose** (v8.12.1) : ODM pour MongoDB
- **jsonwebtoken** (v9.0.2) : Authentification avec JWT
- **bcrypt** (v5.1.1) : Hachage des mots de passe
- **socket.io** (v4.8.1) : Communication en temps réel
- **cors** (v2.8.5) : Gestion des requêtes cross-origin
- **dotenv** (v16.4.7) : Gestion des variables d'environnement
- **express-session** (v1.18.1) : Gestion des sessions
- **cookie-parser** (v1.4.7) : Analyse des cookies HTTP

### Frontend
- **react** (v18.3.1) : Bibliothèque UI
- **react-router-dom** (v6.30.0) : Routage côté client
- **react-redux** (v9.2.0) : Gestion d'état global
- **redux** (v5.0.1) : Gestion d'état prédictible
- **redux-thunk** (v3.1.0) : Middleware pour actions asynchrones
- **redux-persist** (v6.0.0) : Persistance de l'état Redux
- **axios** (v1.8.4) : Client HTTP pour les requêtes API
- **bootstrap** (v5.3.3) & **react-bootstrap** (v2.10.9) : Framework CSS
- **socket.io-client** (v4.8.1) : Client pour la communication en temps réel
- **date-fns** (v4.1.0) : Manipulation de dates
- **dompurify** (v3.2.5) : Prévention des attaques XSS
- **react-icons** (v4.12.0) : Bibliothèque d'icônes

### Outils de développement
- **nodemon** (v3.0.3) : Redémarrage automatique du serveur
- **concurrently** (v8.2.2) : Exécution de commandes en parallèle

## Scripts disponibles

- `npm run start` : Démarre le serveur backend
- `npm run server` : Démarre le serveur backend avec nodemon (redémarrage automatique)
- `npm run client` : Démarre le client React
- `npm run dev` : Démarre le backend et le frontend en parallèle
- `npm run seed` : Remplit la base de données avec des données de test
- `npm run install-all` : Installe les dépendances du backend et du frontend

## Gestion des permissions

- **Administrateurs** : Peuvent créer, modifier et supprimer tous les forums et messages
- **Utilisateurs** : Peuvent créer des forums publics, participer aux discussions et supprimer leurs propres contenus
- **Visiteurs** : Accès limité à la consultation des forums publics

## Fonctionnalités détaillées

### Système de forums
- Création de forums publics ou privés
- Catégorisation des forums
- Fil de discussion avec réponses imbriquées
- Options de modération pour les administrateurs

### Recherche avancée
- Interface à onglets inspirée de LinkedIn
- Recherche de messages par mots-clés
- Recherche d'utilisateurs
- Recherche de forums par titre ou description

### Profils utilisateurs
- Informations personnelles
- Historique des activités
- Gestion des préférences
- Avatar personnalisable

## Compatibilité navigateurs

- Chrome (dernières versions)
- Firefox (dernières versions)
- Safari (dernières versions)
- Edge (dernières versions)

## Licence

Ce projet est sous licence MIT.

## Auteurs

Développé dans le cadre du cours 3IN017 - Technologies du Web
