# Neuro-Arena

Projet inspiré du dossier `9-VoitureSuitCircuit genetic algo` et reconstruit dans un cadre propre.

## Objectif

Le labo compare des voitures neuronales évoluées à une voiture de référence pilotée par un steering behavior pur. L'idée est d'observer si l'évolution surpasse un comportement écrit à la main selon la géométrie du circuit, le niveau de difficulté et les conditions de généralisation.

## Fichiers principaux

- `index.html` : chargement des bibliothèques et des scripts du projet
- `config.js` : configuration des espèces et des niveaux de piste
- `track.js` : génération du circuit à partir d'une graine et d'un niveau
- `vehicle.js` : voiture neuronale
- `steeringcar.js` : voiture de contrôle manuel/pur steering
- `species.js` : populations et état des espèces
- `ga.js` : sélection, mutation et génération suivante
- `dashboard.js` : panneau latéral de synthèse
- `benchmark.js` : benchmark sur plusieurs circuits
- `export.js` : export CSV des résultats

## Démarrage

Ouvrir `index.html` dans un navigateur, ou lancer un petit serveur local dans le dossier `Neuro-Arena`.

## Notes

Le projet reste volontairement lisible et modulaire, en gardant une architecture de type `p5.js + TensorFlow.js` compatible avec le cahier des charges fourni.
