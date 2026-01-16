# 🚀 Configuration Vercel - Surveilleur Frontend

## ⚙️ Paramètres de Configuration

### 1. **Framework Preset**
```
Vite (ou "Other" si Vite n'est pas disponible)
```

### 2. **Root Directory**
```
client
```
⚠️ **IMPORTANT**: Ne pas mettre `./` - mettre exactement `client`

### 3. **Build and Output Settings**

| Paramètre | Valeur |
|-----------|--------|
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 4. **Environment Variables**

Cliquez sur "Environment Variables" et ajoutez :

| Name | Value | Notes |
|------|-------|-------|
| `VITE_API_URL` | `https://surveilleur-backend.onrender.com` | URL de votre backend Render |

⚠️ **Remplacez** `surveilleur-backend.onrender.com` par l'URL réelle de votre backend Render une fois déployé.

---

## 📝 Étapes de Déploiement sur Vercel

### Étape 1: Configuration Initiale
1. ✅ Repository: `sidiiiii/surveilleur` (déjà sélectionné)
2. ✅ Branch: `main`
3. ✅ Framework Preset: `Vite`
4. ⚠️ **Root Directory**: Changez de `./` à `client`

### Étape 2: Build Settings
Les paramètres suivants devraient se remplir automatiquement après avoir défini le Root Directory:
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Étape 3: Environment Variables
1. Cliquez sur "Environment Variables"
2. Ajoutez `VITE_API_URL` avec l'URL de votre backend
3. Sélectionnez tous les environnements (Production, Preview, Development)

### Étape 4: Deploy
1. Cliquez sur "Deploy"
2. Attendez la fin du build (2-5 minutes)
3. Vérifiez les logs en cas d'erreur

---

## 🔍 Vérification Post-Déploiement

### 1. Vérifier le Build
```
✅ Build successful
✅ Output files generated in dist/
✅ No build errors
```

### 2. Vérifier l'Application
- [ ] La page d'accueil se charge
- [ ] Les routes fonctionnent
- [ ] Les appels API fonctionnent (après configuration CORS)
- [ ] Les images et assets se chargent

### 3. Vérifier les Variables d'Environnement
Dans votre code React, vérifiez que:
```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
```

---

## ⚠️ Problèmes Courants

### Erreur: "Build failed"
**Solution**: Vérifiez que le Root Directory est bien `client` et non `./`

### Erreur: "Cannot find module"
**Solution**: Assurez-vous que toutes les dépendances sont dans `client/package.json`

### Erreur: "API calls failing"
**Solution**: 
1. Vérifiez que `VITE_API_URL` est défini
2. Vérifiez que le backend Render est déployé
3. Configurez CORS sur le backend

### Page blanche après déploiement
**Solution**: Vérifiez les logs de build et assurez-vous que `dist/` contient bien les fichiers

---

## 🔗 URLs Importantes

| Service | URL |
|---------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Votre Frontend** | `https://surveilleur.vercel.app` (ou l'URL générée) |
| **Votre Backend** | `https://surveilleur-backend.onrender.com` |
| **GitHub Repo** | https://github.com/sidiiiii/surveilleur |

---

## 📋 Checklist de Déploiement

- [ ] Repository GitHub connecté
- [ ] Root Directory = `client`
- [ ] Framework = Vite
- [ ] Build Command = `npm run build`
- [ ] Output Directory = `dist`
- [ ] Variable `VITE_API_URL` ajoutée
- [ ] Déploiement lancé
- [ ] Build réussi
- [ ] Application accessible
- [ ] CORS configuré sur backend
- [ ] Tests de connexion API réussis

---

## 🎯 Prochaines Étapes

Après le déploiement Vercel réussi:

1. **Notez l'URL Vercel** (ex: `https://surveilleur-abc123.vercel.app`)
2. **Configurez CORS sur Render** avec cette URL
3. **Testez l'application complète**
4. **Configurez un domaine personnalisé** (optionnel)

---

## 💡 Conseils

- ✅ Vercel redéploie automatiquement à chaque push sur `main`
- ✅ Vous pouvez voir les logs de build en temps réel
- ✅ Les Preview Deployments sont créés pour chaque Pull Request
- ✅ Vous pouvez rollback à une version précédente facilement

---

**Créé le**: 16 janvier 2026  
**Projet**: Surveilleur - Plateforme de Gestion Scolaire  
**Documentation**: Pour le déploiement complet, voir `DEPLOY_NOW.md`
