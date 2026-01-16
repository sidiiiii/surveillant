# 🎓 Surveilleur - Plateforme de Gestion Scolaire

Plateforme complète de gestion scolaire permettant le suivi des élèves, notes, absences et communications avec les parents.

## 🚀 Déploiement

### Backend (Render)
1. Créez un compte sur [Render](https://dashboard.render.com/register)
2. Connectez votre repository GitHub
3. Créez une base de données PostgreSQL
4. Déployez le service web avec les variables d'environnement

### Frontend (Vercel)
1. Créez un compte sur [Vercel](https://vercel.com/signup)
2. Importez votre repository GitHub
3. Configurez le répertoire racine sur `client`
4. Ajoutez la variable d'environnement `VITE_API_URL`

## 📦 Installation Locale

### Prérequis
- Node.js 18+
- PostgreSQL 14+

### Backend
```bash
cd server
npm install
cp ../.env.example .env
# Configurez DATABASE_URL dans .env
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## 🔐 Variables d'Environnement

Voir `.env.example` pour la liste complète des variables requises.

### Backend (Render)
- `DATABASE_URL` - URL de connexion PostgreSQL
- `JWT_SECRET` - Clé secrète pour les tokens JWT
- `PORT` - Port du serveur (10000 par défaut sur Render)
- `NODE_ENV` - `production`
- `FRONTEND_URL` - URL du frontend Vercel

### Frontend (Vercel)
- `VITE_API_URL` - URL du backend Render

## 📚 Documentation

Pour un guide complet de déploiement, consultez `GUIDE_DEPLOIEMENT_COMPLET.md`

## 🛠️ Technologies

- **Backend**: Node.js, Express, PostgreSQL
- **Frontend**: React, Vite, TailwindCSS
- **Authentification**: JWT
- **Déploiement**: Render (backend), Vercel (frontend)

## 📄 Licence

Tous droits réservés © 2026
