# 🚀 Guide Complet de Déploiement - Surveilleur Platform
## Backend sur Render + Frontend sur Vercel

---

## 📚 Table des Matières
1. [Préparation du Code](#étape-0-préparation-du-code)
2. [Pousser sur GitHub](#étape-1-pousser-votre-code-sur-github)
3. [Base de Données PostgreSQL](#étape-2-créer-la-base-de-données-postgresql)
4. [Déployer le Backend](#étape-3-déployer-le-backend-sur-render)
5. [Déployer le Frontend](#étape-4-déployer-le-frontend-sur-vercel)
6. [Configuration Finale](#étape-5-configuration-finale)
7. [Tests](#étape-6-tester-votre-application)

---

## Étape 0: Préparation du Code

### ✅ Déjà fait !
Votre code est déjà préparé avec :
- Configuration des variables d'environnement
- CORS configuré pour la production
- `.gitignore` créés

### 🔍 Vérification rapide
Ouvrez un terminal et vérifiez que tout fonctionne localement :

```bash
# Dans le dossier server
cd c:\Users\sidy\Desktop\School\server
npm install
npm start

# Dans un autre terminal, dossier client
cd c:\Users\sidy\Desktop\School\client
npm install
npm run dev
```

Si tout fonctionne, passez à l'étape suivante !

---

## Étape 1: Pousser votre Code sur GitHub

### 1.1 Créer un Repository GitHub

1. **Allez sur GitHub** : https://github.com/new
2. **Connectez-vous** (ou créez un compte si nécessaire)
3. **Créez un nouveau repository** :
   - Repository name: `surveilleur-platform` (ou le nom de votre choix)
   - Description: `Plateforme de suivi scolaire`
   - Visibilité: **Public** (pour le plan gratuit Render)
   - ❌ **NE cochez PAS** "Add a README file"
   - ❌ **NE cochez PAS** "Add .gitignore"
   - Cliquez sur **"Create repository"**

4. **Copiez l'URL du repository** (elle ressemble à : `https://github.com/VOTRE_USERNAME/surveilleur-platform.git`)

### 1.2 Initialiser Git et Pousser le Code

Ouvrez PowerShell dans le dossier `School` :

```powershell
# Naviguez vers votre dossier
cd c:\Users\sidy\Desktop\School

# Initialisez Git
git init

# Ajoutez tous les fichiers
git add .

# Créez le premier commit
git commit -m "Initial commit - Surveilleur Platform"

# Renommez la branche en main
git branch -M main

# Ajoutez le remote (remplacez par VOTRE URL GitHub)
git remote add origin https://github.com/VOTRE_USERNAME/surveilleur-platform.git

# Poussez le code
git push -u origin main
```

**⚠️ Si vous avez une erreur d'authentification** :
- Utilisez un Personal Access Token au lieu du mot de passe
- Guide : https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

✅ **Vérification** : Rafraîchissez votre page GitHub, vous devriez voir vos fichiers !

---

## Étape 2: Créer la Base de Données PostgreSQL

### 2.1 Créer un Compte Render

1. **Allez sur Render** : https://dashboard.render.com/register
2. **Inscrivez-vous** :
   - Option recommandée : "Sign up with GitHub" (plus rapide)
   - Ou utilisez votre email
3. **Vérifiez votre email** si nécessaire

### 2.2 Créer la Base de Données

1. **Sur le Dashboard Render** : https://dashboard.render.com/
2. Cliquez sur **"New +"** (en haut à droite)
3. Sélectionnez **"PostgreSQL"**

4. **Configurez la base de données** :
   ```
   Name: surveilleur-db
   Database: surveilleur
   User: (laissez par défaut - sera généré automatiquement)
   Region: Frankfurt (Europe) - ou la plus proche de vous
   PostgreSQL Version: 16 (ou la dernière)
   Datadog API Key: (laissez vide)
   Instance Type: Free
   ```

5. Cliquez sur **"Create Database"**

6. **Attendez 2-3 minutes** que la base soit créée

### 2.3 Récupérer les Informations de Connexion

1. Une fois créée, cliquez sur votre base de données
2. Allez dans l'onglet **"Info"** ou **"Connect"**
3. **COPIEZ** l'**"Internal Database URL"** (commence par `postgresql://`)
   
   Exemple : `postgresql://surveilleur_user:abc123xyz@dpg-xxxxx-a.frankfurt-postgres.render.com/surveilleur_db`

4. **GARDEZ cette URL** - vous en aurez besoin à l'étape suivante !

📋 **Astuce** : Collez-la dans un fichier texte temporaire pour ne pas la perdre

---

## Étape 3: Déployer le Backend sur Render

### 3.1 Créer le Web Service

1. **Sur le Dashboard Render** : https://dashboard.render.com/
2. Cliquez sur **"New +"** → **"Web Service"**

3. **Connectez votre Repository GitHub** :
   - Si c'est la première fois : Cliquez sur "Connect GitHub"
   - Autorisez Render à accéder à vos repositories
   - Sélectionnez votre repository `surveilleur-platform`

### 3.2 Configurer le Service

Remplissez le formulaire :

```
Name: surveilleur-api
Region: Frankfurt (même que la base de données)
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

### 3.3 Variables d'Environnement (TRÈS IMPORTANT !)

**Avant de cliquer sur "Create Web Service"**, descendez jusqu'à la section **"Environment Variables"**.

Cliquez sur **"Add Environment Variable"** et ajoutez ces variables **UNE PAR UNE** :

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `JWT_SECRET` | `votre_secret_jwt_changez_moi_par_quelque_chose_de_tres_long_et_securise` |
| `DATABASE_URL` | **[Collez l'Internal Database URL de l'étape 2.3]** |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `abdelkadermed06@gmail.com` |
| `SMTP_PASS` | `ynzx hobh ifix anni` |

**⚠️ ATTENTION** : 
- Pour `DATABASE_URL`, utilisez bien l'**Internal Database URL** (pas l'External)
- Pour `JWT_SECRET`, changez-le par quelque chose de sécurisé (au moins 32 caractères)

### 3.4 Déployer

1. Cliquez sur **"Create Web Service"**
2. **Attendez 5-10 minutes** - Render va :
   - Cloner votre code
   - Installer les dépendances
   - Créer les tables de la base de données
   - Démarrer le serveur

3. **Surveillez les logs** en temps réel pour voir la progression

### 3.5 Récupérer l'URL de votre API

1. Une fois le déploiement terminé (statut "Live" en vert)
2. En haut de la page, vous verrez l'URL de votre API
   
   Exemple : `https://surveilleur-api.onrender.com`

3. **COPIEZ cette URL** - vous en aurez besoin pour le frontend !

4. **Testez** : Ouvrez cette URL dans votre navigateur
   - Vous devriez voir : "School Tracking Platform API"

✅ **Backend déployé avec succès !**

---

## Étape 4: Déployer le Frontend sur Vercel

### 4.1 Créer un Compte Vercel

1. **Allez sur Vercel** : https://vercel.com/signup
2. **Inscrivez-vous** :
   - Option recommandée : "Continue with GitHub"
   - Autorisez Vercel à accéder à vos repositories

### 4.2 Créer un Nouveau Projet

1. **Sur le Dashboard Vercel** : https://vercel.com/new
2. Cliquez sur **"Add New..."** → **"Project"**
3. **Importez votre repository** :
   - Cherchez `surveilleur-platform`
   - Cliquez sur **"Import"**

### 4.3 Configurer le Projet

Remplissez le formulaire :

```
Framework Preset: Vite
Root Directory: client (cliquez sur "Edit" et tapez "client")
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### 4.4 Variables d'Environnement

**Avant de déployer**, cliquez sur **"Environment Variables"** :

Ajoutez cette variable :

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://surveilleur-api.onrender.com/api` |

**⚠️ IMPORTANT** : 
- Remplacez `surveilleur-api.onrender.com` par **VOTRE vraie URL Render** (de l'étape 3.5)
- N'oubliez pas le `/api` à la fin !

### 4.5 Déployer

1. Cliquez sur **"Deploy"**
2. **Attendez 2-5 minutes** - Vercel va :
   - Cloner votre code
   - Installer les dépendances
   - Builder l'application
   - La déployer sur leur CDN

3. **Surveillez les logs** pour voir la progression

### 4.6 Récupérer l'URL de votre Site

1. Une fois le déploiement terminé
2. Vous verrez une animation de confettis 🎉
3. Cliquez sur **"Visit"** ou copiez l'URL

   Exemple : `https://surveilleur-platform.vercel.app`

4. **COPIEZ cette URL** - vous en aurez besoin pour la configuration CORS !

✅ **Frontend déployé avec succès !**

---

## Étape 5: Configuration Finale (CORS)

### 5.1 Configurer CORS sur le Backend

Pour que votre frontend Vercel puisse communiquer avec votre backend Render :

1. **Retournez sur Render** : https://dashboard.render.com/
2. Cliquez sur votre service **"surveilleur-api"**
3. Allez dans l'onglet **"Environment"**
4. Cliquez sur **"Add Environment Variable"**
5. Ajoutez :

   | Key | Value |
   |-----|-------|
   | `FRONTEND_URL` | `https://surveilleur-platform.vercel.app` |

   **⚠️** Remplacez par **VOTRE vraie URL Vercel** (de l'étape 4.6)

6. Cliquez sur **"Save Changes"**
7. Le service va **redémarrer automatiquement** (attendez 1-2 minutes)

✅ **Configuration CORS terminée !**

---

## Étape 6: Tester votre Application

### 6.1 Accéder à votre Site

1. Ouvrez votre URL Vercel dans un navigateur
2. Vous devriez voir la page d'accueil avec le formulaire de recherche NNI

### 6.2 Tester la Connexion Admin

1. Cliquez sur **"Portail Administratif"**
2. Connectez-vous avec :
   - Email: `abdelkadermed06@gmail.com`
   - Mot de passe: (votre mot de passe)

3. Si la connexion fonctionne → **Tout est OK !** 🎉

### 6.3 Créer un SuperAdmin (si nécessaire)

Si vous n'avez pas encore de compte admin, créez-en un :

1. Sur Render, allez dans votre service `surveilleur-api`
2. Cliquez sur l'onglet **"Shell"**
3. Exécutez ces commandes :

```bash
cd /opt/render/project/src
node -e "const db = require('./database'); const bcrypt = require('bcryptjs'); async function create() { const hash = await bcrypt.hash('VotreMotDePasse123', 10); await db.query('INSERT INTO users (name, email, password, role, is_superadmin) VALUES ($1, $2, $3, $4, $5)', ['SuperAdmin', 'abdelkadermed06@gmail.com', hash, 'admin', true]); console.log('SuperAdmin créé !'); process.exit(0); } create();"
```

### 6.4 Checklist de Vérification

- [ ] ✅ La page d'accueil s'affiche correctement
- [ ] ✅ Je peux me connecter avec un compte admin
- [ ] ✅ Je peux voir le tableau de bord admin
- [ ] ✅ Je peux créer une classe
- [ ] ✅ Je peux créer un élève
- [ ] ✅ Les emails de création de compte parent fonctionnent

---

## 🎉 Félicitations !

Votre application est maintenant **EN LIGNE** et accessible partout dans le monde !

### 📱 URLs Importantes

- **Site Public** : `https://votre-projet.vercel.app`
- **API Backend** : `https://votre-api.onrender.com`
- **Dashboard Render** : https://dashboard.render.com/
- **Dashboard Vercel** : https://vercel.com/dashboard

---

## 🔧 Maintenance et Mises à Jour

### Pour mettre à jour votre application :

```bash
# Faites vos modifications dans le code
# Puis :
cd c:\Users\sidy\Desktop\School
git add .
git commit -m "Description de vos changements"
git push origin main
```

**Render et Vercel vont automatiquement redéployer** votre application ! 🚀

---

## ⚠️ Limitations du Plan Gratuit

### Render (Backend)
- Le serveur **s'endort après 15 minutes** d'inactivité
- La **première requête** après le sommeil prend 30-60 secondes
- Ensuite, tout redevient normal
- **750 heures gratuites par mois** (suffisant pour un projet personnel)

### Vercel (Frontend)
- **100 GB de bande passante** par mois
- **Déploiements illimités**
- Pas de mise en veille

### PostgreSQL (Render)
- **1 GB de stockage**
- Suffisant pour environ **10,000 élèves**

---

## 🆘 Dépannage

### Erreur "Failed to fetch" ou CORS

**Cause** : Le frontend ne peut pas communiquer avec le backend

**Solution** :
1. Vérifiez que `FRONTEND_URL` est bien configuré sur Render
2. Vérifiez que `VITE_API_URL` est correct sur Vercel
3. Attendez 2 minutes après chaque changement de variable

### Erreur "Database connection failed"

**Cause** : Le backend ne peut pas se connecter à PostgreSQL

**Solution** :
1. Vérifiez que `DATABASE_URL` est correct sur Render
2. Utilisez bien l'**Internal Database URL** (pas l'External)
3. Vérifiez que la base de données est bien "Available" sur Render

### Les emails ne partent pas

**Cause** : Configuration SMTP incorrecte

**Solution** :
1. Vérifiez `SMTP_USER` et `SMTP_PASS` sur Render
2. Assurez-vous d'utiliser un **mot de passe d'application Gmail**
3. Guide : https://support.google.com/accounts/answer/185833

### Le site est lent au premier chargement

**Cause** : Le serveur Render était endormi (plan gratuit)

**Solution** : C'est normal ! Attendez 30-60 secondes, puis tout sera rapide.

---

## 📞 Support

- **Email** : ssurveilleur@gmail.com
- **Documentation Render** : https://render.com/docs
- **Documentation Vercel** : https://vercel.com/docs

---

## 🔗 Liens Utiles

- **Render Dashboard** : https://dashboard.render.com/
- **Vercel Dashboard** : https://vercel.com/dashboard
- **GitHub** : https://github.com/
- **PostgreSQL Docs** : https://www.postgresql.org/docs/

---

**Bonne chance avec votre déploiement ! 🚀**
