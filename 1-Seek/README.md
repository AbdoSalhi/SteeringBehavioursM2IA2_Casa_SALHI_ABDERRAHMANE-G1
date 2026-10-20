# Seek — population de véhicules

Ouvrir `index.html` dans un navigateur (ou servir ce dossier avec un serveur HTTP local).

- 20 véhicules au démarrage, réglables de 1 à 200 avec le slider, pendant le glissement.
- Le menu « Scénario » permet de choisir entre :
  - **Scénario 1 – Factuel** : les vaisseaux poursuivent une cible autonome qui réapparaît aléatoirement quand elle est touchée.
  - **Scénario 2 – Cible fuyante** : la cible utilise `flee()` contre le vaisseau le plus proche détecté dans un rayon de 200 px ; elle fuit jusqu'à 300 px, ou pendant 2,5 s au maximum.
- En scénario 2, les sliders « Détection » et « Endurance » règlent le rayon de perception et la durée maximale de fuite. La barre au-dessus de la cible indique son endurance.
- La touche **D** active ou désactive le cercle de détection de la cible fuyante : jaune sans prédateur dans le rayon, rouge si un vaisseau y est détecté.
- Les contrôles permettent aussi de régler la taille, la vitesse et la maniabilité des véhicules, ainsi que le rayon de la cible.
- Les obstacles sont placés aléatoirement et leur nombre se règle de 0 à 30 ; les véhicules et la cible les contournent par steering.
- Le fond est un dégradé multicolore animé, sans motif répétitif.
- Les véhicules réapparaissent au bord opposé grâce à `Vehicle.edges()`.
- Au contact de la cible en scénario Factuel, cette dernière réapparaît à une position aléatoire.
- Les véhicules conservés lors d'un changement d'effectif gardent leur état.

Tous les objets graphiques sont des instances de `Vehicle` ou de ses sous-classes. Le déplacement autonome est réalisé avec des forces de steering, `applyForce()` et `update()`. `target.js` implémente le steering de la cible Factuelle ; `targetFuyante.js` contient la cible spécialisée du scénario 2. Les fonctions de gestion de population sont dans `population.js` ; la boucle p5 et le sélecteur de scénario sont dans `sketch.js`.

## Tests

Depuis ce dossier, avec Node.js (18 ou plus) :

```sh
node --test tests/*.test.mjs
```

Aucune dépendance à installer. Les tests exécutent les vrais comportements avec un adaptateur vectoriel minimal et un aléatoire déterministe. La validation du rendu avec p5 et des commandes se fait également dans le navigateur.

La [spécification](EXO1_SPECIFICATION.md) décrit les règles, le workflow et les cas limites. Elle constitue le document de conception initial ; l'implémentation et les tests sont maintenant présents.
