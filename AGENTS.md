# Consignes de développement — exemples de steering behaviors

Ces consignes s'appliquent à tous les exemples du dépôt. Avant toute modification, lire aussi [`ARCHITECTURE.md`](ARCHITECTURE.md), qui précise les frontières entre le code de base fourni et le code à développer.

## Référence

S'appuyer sur l'article de Craig W. Reynolds, « Steering Behaviors for Autonomous Characters » (GDC 1999), fourni dans [`ARTICLE_CRAIG_REYNOLDS/Steering Behaviors For Autonomous Characters.pdf`](ARTICLE_CRAIG_REYNOLDS/Steering%20Behaviors%20For%20Autonomous%20Characters.pdf). Les exemples illustrent des règles locales et réactives; ils ne doivent pas remplacer le pilotage par des trajectoires codées à la main.

## Modèle de mouvement

- Utiliser `p5.Vector` pour les positions, vitesses, accélérations et forces.
- Le mouvement d'un véhicule est déterminé par sa vitesse et son accélération; un comportement de pilotage calcule une force, puis la locomotion existante l'applique et met à jour le véhicule.
- Pour un comportement de direction, construire une vitesse désirée à partir d'une direction et de `maxSpeed`, puis calculer `steering = desiredVelocity - currentVelocity`. Limiter la force résultante à `maxForce`.
- Ne pas déplacer directement une entité dans un comportement. Ne pas contourner `applyForce` ni dupliquer la mise à jour de la locomotion.
- Toutes les entités visibles du monde simulé sont des instances de `Vehicle` ou de ses sous-classes. Tout déplacement continu est produit par un steering behavior, appliqué avec `applyForce()`, puis intégré par `Vehicle.update()`. Une téléportation explicite de réapparition et le déplacement imposé par une entrée utilisateur sont des changements de position, pas des comportements de locomotion.
- Respecter la séparation conceptuelle décrite par Reynolds : sélection de l'action (objectif), steering (force de pilotage), locomotion (application de la force et déplacement). Garder le périmètre de chaque petit exemple simple et explicite.

## `vehicle.js` et réutilisation

- Ne jamais modifier un fichier `vehicle.js` sans demander d'abord l'accord explicite de l'utilisateur. Il contient du code fourni qui doit en principe rester intact.
- Ne pas recopier dans une nouvelle classe le code déjà présent dans `vehicle.js`.
- Ajouter les nouveaux comportements sous forme de sous-classes de `Vehicle`, ou de fonctions/modules de comportement indépendants selon l'organisation de l'exemple. Une sous-classe peut réutiliser les comportements existants et en ajouter de nouveaux; elle doit déléguer les forces à `applyForce` et la locomotion à l'implémentation existante.
- Pour les cibles autonomes, utiliser des comportements de steering pour le déplacement continu; ne pas utiliser de timers qui remplacent directement vitesse, position ou accélération.
- Si une modification de `vehicle.js` semble nécessaire, arrêter cette partie du travail et demander l'accord de l'utilisateur avant de l'effectuer.

## Entités et organisation des fichiers

- Garder un fichier distinct par entité identifiée dans l'exemple : par exemple `Player.js`, `Enemy.js`, `Target.js` ou `Obstacle.js`. Ne pas regrouper plusieurs classes d'entités dans un même fichier.
- Toute entité visible doit étendre `Vehicle`, y compris une entité qui paraît statique. Ne créer aucune classe d'objet visible indépendante de `Vehicle`.
- Garder chaque exemple autonome dans son dossier existant. Placer les nouvelles classes d'entité et les comportements dans des fichiers séparés et nommés clairement; éviter les grandes fonctions qui mélangent perception, décision, calcul des forces, mise à jour et dessin.
- Les noms de fichiers déjà en minuscules dans un exemple peuvent conserver cette convention; ne pas renommer les fichiers existants sans nécessité.

## Comportements composables

- Concevoir chaque comportement comme une unité réutilisable qui retourne une force ou un résultat clairement défini.
- Composer les comportements au niveau du contrôleur ou de l'entité avec une somme pondérée, un système de priorités, ou une combinaison adaptée à l'exemple. Garder les comportements eux-mêmes indépendants.
- Exemples de règles : `seek` dirige vers une cible, `flee` s'en éloigne, `arrive` réduit la vitesse désirée près de la cible, `pursue` et `evade` anticipent une position future, `wander` conserve une variation directionnelle continue plutôt qu'un nouveau tirage aléatoire brutal à chaque image.
- L'évitement d'obstacles doit utiliser une perception locale (corridor/look-ahead), retourner une force de steering limitée à `maxForce` et être prioritaire sur la poursuite lorsque l'obstacle présente un risque immédiat. Ne pas déplacer directement le véhicule pour contourner l'obstacle.
- Pour le flocking, garder séparation, alignement et cohésion distincts avant de les combiner.
- Limiter la perception au voisinage utile de l'agent et expliquer les paramètres qui influencent le résultat.
- Pour les jeux avec beaucoup d'entités, centraliser les réglages de performance dans la configuration de l'exemple et proposer des niveaux de qualité qui réduisent la charge sans supprimer de fonctionnalité.
- Préférer les grilles spatiales pour les recherches de voisinage, le culling des entités hors caméra et les pools réutilisables aux allocations et suppressions répétées.
- Garder les boucles `draw()` et `update()` sans allocations évitables; réutiliser vecteurs et tableaux, limiter les calculs coûteux d'effets et étaler les décisions d'IA lorsque cela ne change pas le comportement.
- Toute adaptation automatique de qualité doit avoir des seuils et des temporisations explicites afin d'éviter les oscillations; mesurer et distinguer les gains réels des gains attendus.

## Tests automatisés obligatoires

- Chaque nouvelle fonctionnalité ajoutée à un exemple doit avoir des tests unitaires couvrant ses règles essentielles et ses cas limites. Ajouter ou mettre à jour les tests dans le dossier de l'exemple concerné.
- Vérifier au minimum les valeurs et effets des forces, leurs limites (`maxForce`), les cas proches/éloignés pertinents, et la composition avec les autres comportements concernés. Injecter ou fixer l'aléatoire pour rendre les tests reproductibles.
- Repérer le lanceur de tests déjà utilisé par le dépôt ou l'exemple et exécuter la suite pertinente après les modifications. Si aucun lanceur adapté n'existe, ajouter une configuration légère et une commande reproductible à l'exemple; ne pas installer de moteur physique ou de dépendance inutile.
- Corriger tout échec avant de présenter le travail comme terminé. Ne proposer ni demander à l'utilisateur de tester une fonctionnalité avant d'avoir exécuté les tests automatisés pertinents et confirmé leur réussite. Si les tests ne peuvent pas être exécutés, expliquer précisément le blocage et ne pas prétendre qu'ils sont passés.

## Présentation d'une modification

Indiquer les fichiers créés et modifiés, le comportement ajouté et la commande de tests exécutée avec son résultat. Confirmer que les fichiers `vehicle.js` sont restés inchangés, sauf accord préalable explicite de l'utilisateur.
