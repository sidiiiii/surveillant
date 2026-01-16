# Guide de Déploiement - Surveilleur Platform

## 🚀 Déploiement Backend sur Render

### 1. Préparation de la Base de Données PostgreSQL

1. Allez sur [Render.com](https://render.com) et créez un compte
2. Créez une nouvelle **PostgreSQL Database**:
   - Cliquez sur "New +" → "PostgreSQL"
   - Nom: `surveilleur-db`
   - Region: Choisissez la plus proche (ex: Frankfurt)
   - Plan: **Free** (pour commencer)
   - Cliquez sur "Create Database"

3. **Notez les informations de connexion** (onglet "Connect"):
   - Internal Database URL (commence par `postgresql://...`)
   - Vous en aurez besoin pour le backend

### 2. Déploiement du Backend

1. Sur Render, cliquez sur "New +" → "Web Service"
2. Connectez votre repository GitHub (ou utilisez "Public Git Repository")
3. Configuration:
   - **Name**: `surveilleur-api`
   - **Region**: Même que la base de données
   - **Branch**: `main` (ou votre branche principale)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Variables d'environnement** (onglet "Environment"):
   Ajoutez ces variables:
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=votre_secret_jwt_super_securise_changez_moi
   DATABASE_URL=[Collez l'Internal Database URL de votre PostgreSQL]
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=abdelkadermed06@gmail.com
   SMTP_PASS=ynzx hobh ifix anni
   ```

5. Cliquez sur "Create Web Service"
6. Attendez le déploiement (5-10 minutes)
7. **Notez l'URL de votre API** (ex: `https://surveilleur-api.onrender.com`)

---

## 🌐 Déploiement Frontend sur Vercel

### 1. Préparation du Frontend

Avant de déployer, vous devez mettre à jour l'URL de l'API dans le frontend.

### 2. Déploiement sur Vercel

1. Allez sur [Vercel.com](https://vercel.com) et créez un compte
2. Cliquez sur "Add New..." → "Project"
3. Importez votre repository GitHub
4. Configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Variables d'environnement**:
   Ajoutez cette variable:
   ```
   VITE_API_URL=https://surveilleur-api.onrender.com/api
   ```
   ⚠️ Remplacez par l'URL réelle de votre backend Render

6. Cliquez sur "Deploy"
7. Attendez le déploiement (2-5 minutes)
8. Votre site sera disponible sur: `https://votre-projet.vercel.app`

---

## 🔧 Configuration Post-Déploiement

### 1. Mettre à jour CORS sur le Backend

Une fois que vous avez l'URL Vercel, vous devez autoriser les requêtes depuis cette URL.

Ajoutez une variable d'environnement sur Render:
```
FRONTEND_URL=https://votre-projet.vercel.app
```

### 2. Tester votre Application

1. Visitez votre URL Vercel
2. Essayez de vous connecter avec un compte admin
3. Vérifiez que toutes les fonctionnalités marchent

---

## 📝 Checklist de Déploiement

- [ ] Base de données PostgreSQL créée sur Render
- [ ] Backend déployé sur Render avec toutes les variables d'environnement
- [ ] URL du backend notée
- [ ] Frontend configuré avec la bonne URL d'API
- [ ] Frontend déployé sur Vercel
- [ ] CORS configuré pour autoriser l'URL Vercel
- [ ] Test de connexion réussi
- [ ] Test de création d'élève réussi
- [ ] Emails fonctionnels

---

## 🆘 Dépannage

### Le backend ne démarre pas
- Vérifiez les logs sur Render
- Assurez-vous que `DATABASE_URL` est correctement configurée

### Le frontend ne se connecte pas au backend
- Vérifiez que `VITE_API_URL` est correct
- Vérifiez les erreurs CORS dans la console du navigateur

### Les emails ne partent pas
- Vérifiez `SMTP_USER` et `SMTP_PASS`
- Assurez-vous d'utiliser un mot de passe d'application Gmail

---

## 💡 Conseils

1. **Gardez vos secrets sécurisés**: Ne commitez jamais `.env` sur GitHub
2. **Utilisez des branches**: Déployez depuis `main` uniquement
3. **Surveillez les logs**: Render et Vercel offrent des logs en temps réel
4. **Plan gratuit**: Render Free tier s'endort après 15 min d'inactivité (première requête sera lente)

---

## 📞 Support

En cas de problème, contactez: ssurveilleur@gmail.com
