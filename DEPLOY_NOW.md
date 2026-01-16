# 🚀 Guide de Déploiement Rapide

## Étape 1: Créer la Base de Données PostgreSQL sur Render

1. Allez sur https://render.com
2. Créez un compte (gratuit)
3. Cliquez sur "New +" → "PostgreSQL"
4. Configurez:
   - Name: `surveilleur-db`
   - Database: `surveilleur`
   - User: (laissez par défaut)
   - Region: Frankfurt (ou la plus proche)
   - Plan: **Free**
5. Cliquez sur "Create Database"
6. **IMPORTANT**: Copiez l'"Internal Database URL" (vous en aurez besoin)

---

## Étape 2: Déployer le Backend sur Render

1. Sur Render, cliquez sur "New +" → "Web Service"
2. Connectez votre GitHub ou utilisez "Public Git Repository"
3. Configurez:
   - **Name**: `surveilleur-api`
   - **Region**: Frankfurt (même que la DB)
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Variables d'environnement** (très important!):
   ```
   NODE_ENV=production
   PORT=3000
   JWT_SECRET=changez_ce_secret_par_quelque_chose_de_tres_securise
   DATABASE_URL=[Collez l'Internal Database URL de l'étape 1]
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=abdelkadermed06@gmail.com
   SMTP_PASS=ynzx hobh ifix anni
   ```

5. Cliquez sur "Create Web Service"
6. Attendez 5-10 minutes
7. **Copiez l'URL de votre API** (ex: `https://surveilleur-api.onrender.com`)

---

## Étape 3: Déployer le Frontend sur Vercel

1. Allez sur https://vercel.com
2. Créez un compte (gratuit)
3. Cliquez sur "Add New..." → "Project"
4. Importez votre repository GitHub
5. Configurez:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

6. **Variable d'environnement**:
   ```
   VITE_API_URL=https://surveilleur-api.onrender.com/api
   ```
   ⚠️ Remplacez par votre vraie URL Render (de l'étape 2)

7. Cliquez sur "Deploy"
8. Attendez 2-5 minutes
9. **Copiez l'URL de votre site** (ex: `https://surveilleur.vercel.app`)

---

## Étape 4: Configurer CORS

1. Retournez sur Render (votre backend)
2. Allez dans "Environment"
3. Ajoutez cette variable:
   ```
   FRONTEND_URL=https://surveilleur.vercel.app
   ```
   ⚠️ Remplacez par votre vraie URL Vercel (de l'étape 3)

4. Cliquez sur "Save Changes"
5. Le service va redémarrer automatiquement

---

## ✅ C'est Terminé !

Visitez votre URL Vercel et testez votre application !

### 🔍 Vérifications:
- [ ] Je peux accéder à la page d'accueil
- [ ] Je peux me connecter avec un compte admin
- [ ] Je peux créer un élève
- [ ] Les emails partent correctement

---

## ⚠️ Important à Savoir

- **Plan Gratuit Render**: Le serveur s'endort après 15 min d'inactivité
  - La première requête après le sommeil prendra 30-60 secondes
  - C'est normal et gratuit !

- **Logs**: En cas de problème, consultez les logs sur Render et Vercel

---

## 🆘 Problèmes Courants

### "Failed to fetch" ou erreur CORS
→ Vérifiez que `FRONTEND_URL` est bien configuré sur Render

### "Database connection failed"
→ Vérifiez que `DATABASE_URL` est correct sur Render

### Les emails ne partent pas
→ Vérifiez `SMTP_USER` et `SMTP_PASS` sur Render

---

## 📞 Besoin d'aide ?

Email: ssurveilleur@gmail.com
