# 🚀 Guide de Déploiement Rapide - Surveilleur

## ✅ Étape 1 : Pousser les nouveaux fichiers sur GitHub

Ouvrez un **nouveau PowerShell** et exécutez :

```powershell
cd c:\Users\sidy\Desktop\School
git add .
git commit -m "Add deployment configuration files"
git push origin main
```

---

## 🗄️ Étape 2 : Créer la Base de Données sur Render

### A. Créer un compte Render
1. Allez sur https://dashboard.render.com/register
2. Inscrivez-vous avec GitHub (recommandé) ou email
3. Vérifiez votre email si nécessaire

### B. Créer la base de données PostgreSQL
1. Dans le dashboard Render, cliquez sur **"New +"** → **"PostgreSQL"**
2. Remplissez les informations :
   - **Name** : `surveilleur-db`
   - **Database** : `surveilleur`
   - **User** : `surveilleur`
   - **Region** : Choisissez le plus proche (ex: Frankfurt)
   - **Plan** : **Free** (gratuit)
3. Cliquez sur **"Create Database"**
4. ⏳ Attendez 2-3 minutes que la base soit créée
5. **📋 COPIEZ** l'URL "Internal Database URL" (commence par `postgresql://`)

---

## 🖥️ Étape 3 : Déployer le Backend sur Render

### A. Créer le service web
1. Dans Render, cliquez sur **"New +"** → **"Web Service"**
2. Connectez votre repository GitHub `surveilleur`
3. Remplissez les informations :

| Champ | Valeur |
|-------|--------|
| **Name** | `surveilleur-backend` |
| **Region** | Même que la base de données |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | **Free** |

### B. Configurer les variables d'environnement

Cliquez sur **"Advanced"** puis ajoutez ces variables :

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Collez l'URL copiée à l'étape 2 |
| `JWT_SECRET` | Générez une clé aléatoire (ex: `surveilleur2026secret`) |
| `PORT` | `10000` |
| `FRONTEND_URL` | Laissez vide pour l'instant (on l'ajoutera après) |

4. Cliquez sur **"Create Web Service"**
5. ⏳ Attendez 5-10 minutes que le déploiement se termine
6. **📋 COPIEZ** l'URL du backend (ex: `https://surveilleur-backend.onrender.com`)

---

## 🌐 Étape 4 : Déployer le Frontend sur Vercel

### A. Créer un compte Vercel
1. Allez sur https://vercel.com/signup
2. Inscrivez-vous avec GitHub (recommandé)
3. Autorisez Vercel à accéder à vos repositories

### B. Importer le projet
1. Cliquez sur **"Add New..."** → **"Project"**
2. Sélectionnez votre repository `surveilleur`
3. Configurez le projet :

| Champ | Valeur |
|-------|--------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### C. Ajouter les variables d'environnement

Dans **"Environment Variables"**, ajoutez :

| Name | Value |
|------|-------|
| `VITE_API_URL` | L'URL du backend Render (ex: `https://surveilleur-backend.onrender.com`) |

4. Cliquez sur **"Deploy"**
5. ⏳ Attendez 3-5 minutes
6. **📋 COPIEZ** l'URL du frontend (ex: `https://surveilleur.vercel.app`)

---

## 🔄 Étape 5 : Finaliser la Configuration CORS

### Retournez sur Render (backend)
1. Allez dans votre service `surveilleur-backend`
2. Cliquez sur **"Environment"**
3. Modifiez la variable `FRONTEND_URL` :
   - **Value** : L'URL Vercel (ex: `https://surveilleur.vercel.app`)
4. Cliquez sur **"Save Changes"**
5. Le service va redémarrer automatiquement (1-2 minutes)

---

## ✅ Étape 6 : Tester l'Application

1. Ouvrez l'URL Vercel dans votre navigateur
2. Créez une nouvelle école
3. Connectez-vous
4. Testez les fonctionnalités

---

## 🎉 Félicitations !

Votre application est maintenant en ligne ! 🚀

### 📱 URLs de votre application :
- **Frontend** : `https://surveilleur.vercel.app` (ou votre URL Vercel)
- **Backend API** : `https://surveilleur-backend.onrender.com` (ou votre URL Render)

---

## ⚠️ Limitations du Plan Gratuit

### Render (Backend)
- ⏸️ Le serveur s'endort après 15 minutes d'inactivité
- 🐌 Premier chargement lent (30-60 secondes) après inactivité
- 💾 Base de données limitée à 1 GB
- 🔄 Supprimée après 90 jours d'inactivité

### Vercel (Frontend)
- ✅ Toujours actif et rapide
- 📊 100 GB de bande passante/mois
- 🚀 Déploiement automatique à chaque push GitHub

---

## 🔧 Dépannage

### Le backend ne démarre pas
- Vérifiez que `DATABASE_URL` est correctement configuré
- Regardez les logs dans Render : **Logs** → **Deploy Logs**

### Erreur CORS
- Vérifiez que `FRONTEND_URL` dans Render correspond exactement à l'URL Vercel
- Pas de `/` à la fin de l'URL

### Le frontend ne se connecte pas au backend
- Vérifiez que `VITE_API_URL` dans Vercel est correct
- Testez l'API directement : `https://votre-backend.onrender.com/`

---

## 📞 Support

Pour toute question, consultez :
- [Documentation Render](https://render.com/docs)
- [Documentation Vercel](https://vercel.com/docs)
