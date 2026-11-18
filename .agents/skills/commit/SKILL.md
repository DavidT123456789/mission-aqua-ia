---
name: commit
description: >-
  Automatise la mise à jour et la publication en ligne (git add, commit avec message descriptif en français, et git push origin main). Utiliser cette compétence lorsque l'utilisateur tape /commit ou demande de sauvegarder, commiter ou pousser les modifications en ligne.
---

# Commit et Mise en Ligne Automatique (`/commit`)

Cette procédure automatise l'indexation des modifications (`git add`), la création d'un commit avec un message clair et conventionnel en français, et l'envoi vers la branche `main` du dépôt distant (`origin`) pour mettre à jour la version en ligne.

## Étapes à exécuter automatiquement (sans demander de confirmation)

1. **Cibler le dépôt Git** :
   - Si le répertoire courant est le dossier parent `Aqua IA`, exécuter les commandes Git dans le sous-dossier `mission-aqua-ia` (`git -C "mission-aqua-ia" ...` ou `Set-Location "mission-aqua-ia"`).
2. **Vérifier l'état des modifications** :
   - Exécuter `git status` et `git diff --stat` pour inspecter les fichiers modifiés, ajoutés ou supprimés.
   - S'il n'y a aucune modification locale, vérifier s'il y a des commits en attente d'envoi (`git status -sb`) et exécuter `git push origin main` directement.
3. **Tout exécuter en une seule passe (indexation, commit et push)** :
   - Si l'utilisateur a fourni un message avec la commande, l'utiliser.
   - Sinon, générer automatiquement un message de commit concis et explicite en français au format Conventional Commits (`feat: ...`, `fix: ...`, `style: ...`, `chore: ...`) décrivant les changements détectés.
   - Exécuter directement sans demander de confirmation préalable (en syntaxe PowerShell compatible Windows) :
     ```powershell
     git -C "mission-aqua-ia" add .; if ($LASTEXITCODE -eq 0) { git -C "mission-aqua-ia" commit -m "<message>" }; if ($LASTEXITCODE -eq 0) { git -C "mission-aqua-ia" push origin main }
     ```
4. **Résumé final** :
   - Une fois le push terminé, résumer à l'utilisateur les fichiers mis à jour, le message du commit créé et confirmer que le push vers `origin/main` a réussi.
