# Feuille de Route Intelligence Artificielle - Plateforme Surveilleur

## 🎯 Objectifs de l’IA
- **Anticiper l’absentéisme**
- **Analyser la performance scolaire**
- **Aide à la décision (Parents/Admin)**
- **Améliorer la communication**

---

## 🟢 Étape 1 : Collecte des données (État actuel)
**Données nécessaires :**
- [x] Historique des absences (`attendance` table)
- [x] Résultats scolaires (`grades` table)
- [x] Infos élèves (`students` table)
- [ ] **Calendrier scolaire** (Dates de début/fin de trimestres, vacances) -> *À implémenter*

## 🟢 Étape 2 : Préparation et nettoyage
**Actions :**
- Suppression des incohérences.
- Normalisation des notes (ex: ramener tout sur 20).
- Gestion des valeurs nulles.

## 🟢 Étape 3 : Analyse descriptive (Dashboards)
**Fonctionnalités à développer :**
- Graphiques d'évolution des notes par élève/matière.
- Courbe de tendance d'absentéisme mensuel.
- Comparaison Moyenne Élève vs Moyenne Classe.

## 🟢 Étape 4 : Modèles IA (Niveau 1)
**Prédictions :**
- Risque d'absentéisme (Probabilité).
- Détection de décrochage scolaire (Notes en baisse continue).

## 🟢 Étape 5 : Système d’alertes
- Notifications automatiques : "Attention, baisse détectée en Mathématiques".

## 🟢 Étape 6 : Assistant Intelligent (Chatbot)
- "Mon fils est-il là ?" -> Réponse auto basée sur `attendance`.

## 🟢 Étape 7 : Tableaux de bord stratégiques
- Vue d'ensemble pour le Directeur (Classes à risque, Professeurs avec taux d'absentéisme élevé).

---

## 🗓️ Status Prochaines Étapes
1. **Créer la table `school_calendar`** pour définir les périodes scolaires (essentiel pour l'IA).
2. **Créer un module d'analyse** (Backend) pour calculer les statistiques simples (Étape 3).
3. **Mettre à jour le Dashboard Admin** avec ces premiers graphiques.
