# Le serpent et les poules

Simulation plein écran en p5.js 1.7.0 : un serpent suit la souris, évite les
obstacles, grandit en mangeant des poules, et celles-ci s'enfuient et se
séparent en troupeau (séparation, alignement, cohésion et alertes en chaîne).
Les leurres peuvent attirer ou effrayer les poules, ou détourner le serpent.
Les zones mare/buisson ralentissent ou dissimulent les véhicules. L'énergie
est activée aux niveaux 6, 9 et 10 ; elle baisse avec le temps et remonte en
mangeant. Au niveau 6, l'aigle attaque les serpents visibles trop longs ou trop
lents. Le débogage affiche les vecteurs de steering et les rayons des zones.
Le niveau 7 demande de rabattre les poules dans un enclos ouvert sans les
manger.

## Niveaux et objectifs

| Niveau | Nom | Objectif |
| --- | --- | --- |
| 1 | Le Poulailler | Manger 5 poules, sans limite de temps. |
| 2 | Les Rochers | Manger 8 poules en 60 s ; 5 obstacles à poser. |
| 3 | Le Troupeau | Manger 10 poules en 90 s ; les poules se déplacent en groupe. |
| 4 | Le Passage | Manger 10 poules, sans limite de temps. |
| 5 | La Mare | Manger 10 poules en 80 s ; deux mares ralentissent les animaux. |
| 6 | L'Aigle | Survivre 90 s et manger au moins 6 poules ; se cacher dans les buissons. |
| 7 | Le Berger | Rentrer 8 poules dans l'enclos en 120 s, sans les manger. |
| 8 | La Nuit | Manger 10 poules en 100 s ; visibilité limitée au halo et au cône de vision. |
| 9 | La Tempête | Manger 12 poules en 110 s en évitant 4 rochers mobiles. |
| 10 | La Reine | Capturer la reine en 120 s ; les graines peuvent disperser ses 6 gardes. |

Les réussites débloquent le niveau suivant et sont sauvegardées dans le
navigateur. Une défaite n'efface pas les niveaux déjà débloqués.

## Contrôles

- Souris : guider la tête du serpent.
- Clic gauche : placer un obstacle ; Maj-clic ou clic droit : le retirer.
- Molette : régler le rayon du prochain obstacle.
- `1` / `2` / `3` : sélectionner graines / faux serpent / mulot.
- Clic molette ou `L` : poser le leurre sélectionné (maximum 5, délai de 2 s).
- Dans le menu, cliquer un niveau débloqué ; `ENTRÉE` commence ou passe au
  niveau suivant.
- `C` : effacer les obstacles posables ; `R` : recommencer ; `M` : menu.
- `D` : activer le debug ; `Espace` : pause.
- Aux niveaux 6 et 9, l'énergie perd 2 points par seconde ; manger une poule
  en rend 25. Au niveau 10, elle perd 1,25 point par seconde ; manger un garde
  en rend 10. Une attaque de l'aigle coûte 30 points d'énergie, retire quatre
  segments et rend le serpent invulnérable pendant 1,5 s. Un buisson permet de
  se cacher.
- Au niveau 7, le serpent repousse les poules : guide-les vers l'ouverture de
  l'enclos. Les poules rentrées restent à l'intérieur ; deux faux serpents
  maximum sont disponibles avec `2`.
- Au niveau 8, « La Nuit », les poules ne voient le serpent que dans un cône
  de 110° à 160 px ; un bruit à moins de 50 px les alerte. Le serpent éclaire
  son voisinage et les poules ne sont visibles que dans ce halo.
- Au niveau 9, « La Tempête », quatre rochers rebondissent sur les bords. Leurs
  trajectoires sont anticipées par l'évitement ; une collision retire trois
  segments et 20 points d'énergie, avec 1,5 s d'invulnérabilité.
- Au niveau 10, « La Reine », six gardes protègent la reine et suivent ses
  déplacements. Les leurres graines peuvent disperser les gardes ; les manger
  rend 10 points d'énergie sans score ni croissance. Capturer la reine termine
  le jeu et affiche le score et les étoiles cumulés.
- Sliders en haut à droite : taille/vitesse des poules et force des entités
  (l'effectif est fixé par le niveau).
- Sliders en bas à droite : poids de l'évitement, vitesse maximale du serpent,
  détection des poules et longueur de vue de l'évitement.

## Structure des fichiers

- `index.html`, `style.css` : page, ordre des scripts et interface.
- `sketch.js` : setup p5.js, scène, contrôles, HUD et orchestration.
- `vehicle.js` : base Vehicle et comportements de steering.
- `target.js`, `bouncingBall.js`, `boulder.js` : cible mobile, rebonds sur les
  bords et rochers dévalants.
- `eagle.js` : patrouille, poursuite, attaque et retraite de l'aigle.
- `queen.js` : reine, fuite devant le serpent et couronne.
- `pen.js` : enclos ouvert, clôture et limites de déplacement intérieures.
- `obstacle.js` : obstacles circulaires et aperçu de placement.
- `decoy.js` : leurres graines, faux serpent et mulot, avec durée de vie.
- `zone.js` : mares ralentissantes et buissons dissimulateurs.
- `hen.js` : comportement, apparition et dessin des poules.
- `snake.js` : tête, corps, collisions, croissance et effets de capture.
- `levels.js`, `objective.js`, `level.js` : données des dix niveaux, objectifs
  manger/survivre/enclos/reine, progression sauvegardée, budget d'obstacles et
  écrans d'état.
- `libraries/` : p5.js et p5.sound distribués avec le projet.
- `tests/` : tests Node.js des comportements et des entités.

Ouvrir `index.html` dans un navigateur moderne pour jouer.
