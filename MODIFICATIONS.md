# Modifications apportées au projet School

## Date: 2026-01-08

### 1. Changement de terminologie: "Paramètres" → "Email"

**Fichiers modifiés:**
- `client/src/pages/admin/AdminDashboard.jsx` - Bouton de navigation
- `client/src/pages/admin/AdminSettings.jsx` - Titre et messages

**Description:**
Le terme "Paramètres" a été remplacé par "Email" dans l'interface pour mieux refléter la fonction de configuration des emails.

---

### 2. Configuration Email par défaut

**Fichiers modifiés:**
- `server/src/services/emailService.js`

**Description:**
Le système utilise maintenant **abdelkadermed06@gmail.com** comme email par défaut pour l'envoi de tous les emails, sauf si une école a configuré ses propres paramètres SMTP dans la section "Email" du site.

**Comportement:**
- ✅ Si l'école **N'A PAS** configuré ses paramètres SMTP → Utilise `abdelkadermed06@gmail.com`
- ✅ Si l'école **A** configuré ses paramètres SMTP → Utilise l'email de l'école

---

### 3. Nouvelle fonctionnalité: Gestion des documents élèves

**Nouveaux fichiers créés:**
- `client/src/pages/admin/StudentDocuments.jsx` - Interface de gestion des documents
- `server/src/routes/documents.js` - API pour les documents
- `server/migrate_documents.js` - Script de migration de la base de données

**Fichiers modifiés:**
- `client/src/App.jsx` - Ajout de la route `/admin/student/:studentId/documents`
- `client/src/pages/admin/AdminDashboard.jsx` - Ajout du bouton "Documents" (icône violette)
- `server/src/index.js` - Ajout de la route API `/api/students/:studentId/documents`

**Description:**
Nouvelle fonctionnalité permettant d'importer et de gérer les photos/PDF des exercices, devoirs et examens pour chaque élève.

**Fonctionnalités:**
- 📤 **Upload de documents** (images et PDF)
- 📁 **Catégorisation** par type: Exercice, Devoir, Examen
- 🗑️ **Suppression** de documents
- 👁️ **Visualisation** en grille avec aperçu
- 📝 **Description** optionnelle pour chaque document

**Comment utiliser:**
1. Dans le tableau de bord admin, cliquez sur l'icône **violette** (📄) à côté d'un élève
2. Sélectionnez le type de document (Exercice, Devoir, ou Examen)
3. Choisissez le fichier (image ou PDF)
4. Ajoutez une description (optionnel)
5. Cliquez sur "Télécharger"

**Base de données:**
Une nouvelle table `student_documents` a été créée avec les colonnes:
- `id` - Identifiant unique
- `student_id` - Référence à l'élève
- `type` - Type de document (exercice, devoir, examen)
- `file_url` - Chemin du fichier
- `description` - Description optionnelle
- `created_at` - Date de création

---

## Serveurs en cours d'exécution

- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173 (Local) / http://192.168.150.191:5173 (Network)

---

## Notes importantes

⚠️ **Email par défaut**: Assurez-vous que le fichier `.env` contient les bonnes informations SMTP pour `abdelkadermed06@gmail.com`

⚠️ **Uploads**: Les documents sont stockés dans `server/uploads/documents/`

⚠️ **Sécurité**: Seuls les administrateurs et enseignants peuvent gérer les documents des élèves
