# Organiz-Asso

Une plateforme de communication moderne pour les associations, permettant aux membres de communiquer efficacement via des forums.

## Fonctionnalités Principales

- **Système de Forums**
  - Création de forums publics et privés
  - Discussions structurées avec réponses imbriquées
  - Modération des contenus


- **Recherche Avancée**
  - Recherche multi-critères (messages, utilisateurs, forums)
  - Filtres et options de recherche
  - Mise en évidence des résultats

- **Gestion des Utilisateurs**
  - Inscription et authentification sécurisée
  - Validation par administrateur
  - Différents niveaux d'accès (membre, admin)

## Technologies Utilisées

### Frontend
- React 18.3.1
- Redux 5.0.1
- React Router 6.30.0
- Bootstrap 5.3.3
- Socket.io-client 4.8.1

### Backend
- Node.js 18+
- Express 4.21.2
- MongoDB avec Mongoose 8.12.1
- JWT pour l'authentification
- Socket.io 4.8.1


## Problèmes Rencontrés

1. **Intégration Socket.io**
   - Difficultés initiales avec la configuration du serveur WebSocket
   - Problèmes de synchronisation des messages en temps réel
   - Solution : Mise en place d'un système de file d'attente pour les messages

2. **Gestion des États Redux**
   - Complexité dans la gestion des états imbriqués
   - Problèmes de performance avec les mises à jour fréquentes
   - Solution : Implémentation de la normalisation des données

3. **Sécurité**
   - Vulnérabilités potentielles dans l'authentification JWT
   - Solution : Mise en place de tokens de rafraîchissement et validation renforcée

## Tâches Restantes


1. **Améliorations Techniques**
   - [ ] Optimisation des performances de la base de données
   - [ ] Mise en place de tests automatisés
   - [ ] Amélioration de la documentation API
   - [ ] Mise en place d'un système de cache

## Choix de Modélisation

### Différences avec les Suggestions du Cours

1. **Architecture Frontend**
   - Choix d'utiliser Redux au lieu de Context API
   - Raison : Meilleure gestion des états complexes et outils de débogage plus puissants
2. **Structure de la Base de Données**
   - Utilisation de MongoDB en local avec MongoDB Compass
   - Possibilité de basculer vers MongoDB Atlas en copiant simplement l'URL du cluster dans le fichier .env
   - Raison : Facilité de développement en local tout en gardant la flexibilité de déploiement sur Atlas

## Installation


2. **Installer les dépendances du serveur**
   ```bash
   cd server
   npm install
   ```

3. **Installer les dépendances du client**
   ```bash
   cd ../client
   npm install
   ```

4. **Configuration**
   - Créer un fichier `.env` dans le dossier `server` avec les variables suivantes :
     ```
     MONGODB_URI=votre_uri_mongodb
     JWT_SECRET=votre_secret_jwt
     PORT=5000
     ```

5. **Lancer l'application**
   - Pour le serveur :
     ```bash
     cd server
     npm start
     ```
   - Pour le client :
     ```bash
     cd client
     npm start
     ```

## Structure du Projet

```
organiz-asso/
├── server/           # Backend Express
│   ├── controllers/  # Logique métier
│   ├── models/       # Modèles MongoDB
│   ├── routes/       # Routes API
│   └── server.js     # Point d'entrée
├── client/          # Frontend React
│   ├── public/       # Fichiers statiques
│   └── src/          # Code source React
└── package.json      # Dépendances
```

## Sécurité

- Authentification JWT
- Hachage des mots de passe avec bcrypt
- Protection contre les injections
- Validation des données
- CORS configuré

## Fonctionnalités à Venir

- [ ] Chat instantané (la collection chatmessages existe mais n'est pas encore implémentée)

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Auteurs

- Tebti Anis - 

