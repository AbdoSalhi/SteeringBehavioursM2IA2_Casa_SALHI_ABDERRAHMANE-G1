# Architecture du dépôt

Ce dépôt regroupe de petits exemples autonomes de steering behaviors avec p5.js. Chaque dossier numéroté correspond à un exemple ou à sa correction. Les consignes de développement complètes sont dans [`AGENTS.md`](AGENTS.md).

## Frontières du code

### `vehicle.js` : code fourni et protégé

Les fichiers `vehicle.js` fournissent le modèle de véhicule utilisé par les exemples : état (position, vitesse, accélération), paramètres de vitesse et de force, comportements déjà disponibles, application des forces, locomotion et dessin.

**Ne pas modifier un fichier `vehicle.js` sans demander d'abord l'accord explicite de l'utilisateur.** Ce code a été fourni et doit en principe rester inchangé. Ne pas dupliquer ses comportements ni remplacer sa logique interne.

Pour étendre un exemple, créer une sous-classe distincte de `Vehicle` pour chaque entité identifiée (par exemple joueur, ennemi ou véhicule spécialisé). La sous-classe peut réutiliser les méthodes existantes et ajouter des comportements. Elle doit produire des forces avec la loi `steering = vitesseDésirée - vitesseActuelle`, respecter `maxForce`, puis utiliser `applyForce`; la mise à jour de la locomotion reste celle du véhicule de base.

### Classes d'entité

Créer un fichier séparé par type d'entité, dans le dossier de l'exemple concerné : par exemple `Player.js`, `Enemy.js` et `Target.js`. Ne pas regrouper plusieurs types d'entités dans un fichier. Toute entité visible, même si elle paraît statique, étend `Vehicle`; ne pas créer de classe d'objet visible indépendante de `Vehicle`.

Dans `1-Seek`, `Target` et `TargetFuyante` sont des véhicules autonomes, tandis que `MouseTarget` représente une cible déplacée par l'entrée utilisateur. Les comportements continus de ces entités passent par steering, `applyForce()` et `Vehicle.update()`. Le contrôleur sélectionne une cible et orchestre les vaisseaux; il ne code pas leur locomotion.

Les obstacles de `1-Seek` sont des instances statiques de `Vehicle`. Le module `obstacle.js` contient leur génération et une force d'évitement locale basée sur le corridor prédit du véhicule. En cas de risque, cette force a priorité sur `seek()` ou `flee()`; elle n'altère pas directement la position des agents.

### Comportements et composition

Garder chaque comportement indépendant, réutilisable et testable. Les entités ou le code de l'exemple combinent les forces avec une somme pondérée ou une règle de priorité. Distinguer l'objectif choisi, le calcul des forces de steering et l'application des forces par la locomotion.

Le scénario `1-Seek` propose un mode Factuel, où les vaisseaux poursuivent une cible autonome qui réapparaît lorsqu'elle est touchée, et un mode Cible fuyante. Dans ce dernier, `TargetFuyante extends Vehicle`, choisit le vaisseau le plus proche dans son rayon de détection, utilise le comportement hérité `flee()` et restaure son steering normal à la fin de la fuite ou de son endurance. L'interface permet de régler le rayon de détection et la durée d'endurance; la touche D affiche le cercle de perception.

Le fond du même exemple est un dégradé multicolore animé sans motif répété. Le contrôle d'obstacles ajuste leur nombre et les régénère à des positions aléatoires dans le canvas.

Dans `2-PursueEvade`, chaque `Target` qui détecte le véhicule poursuiveur lance une salve immédiate de dix instances `Decoy`, avec un cooldown indépendant de dix secondes avant sa prochaine salve. Un leurre a une durée de vie de deux secondes; tant qu'un leurre est actif, `selectMissileTarget()` choisit le plus proche des leurres au lieu des cibles réelles. Les leurres sont des `Vehicle` et avancent par steering puis locomotion standard.

Le rendu de ce scénario utilise `Fox extends Vehicle` pour le poursuiveur, `Target` pour les poules et `Decoy` pour les poussins-leurres. Ces classes spécialisent uniquement leur rendu sans modifier la locomotion fournie par `Vehicle`.

Le fond de `2-PursueEvade` est dessiné sur le canvas : ciel nocturne étoilé, lune, ferme éclairée, couches de forêt et premier plan. Le décor ne dépend d'aucune ressource graphique externe.

La barre de contrôle de `2-PursueEvade` règle le nombre, la taille, la vitesse, la force et le rayon de détection des poules, ainsi que la vitesse et la force du renard. Le compteur de captures n'incrémente que lorsqu'une poule entre en contact avec le renard; attraper un poussin-leurre n'augmente pas ce compteur.

Dans `3-Arrival`, `Snake & Mice` propose maintenant une arène Slither.io de 6000 × 6000. La caméra suit et dézoome avec le joueur; une grille de points hexagonale défile sous les serpents et une bordure rouge marque les limites mortelles. `Snake`, `SnakeSegment`, `SnakeBot`, `Mouse`, `FoodOrb`, `Obstacle`, `Shockwave` et les particules sont des sous-classes de `Vehicle`. Les déplacements continus passent par le steering, `applyForce()` et la locomotion héritée; la rotation du serpent joueur est plafonnée et les bots suivent des objectifs locaux, fuient les serpents plus grands et anticipent leurs proies.

Les orbes sont indexées dans une grille spatiale, aspirées à proximité du joueur, puis renouvelées pour maintenir la densité. Les souris conservent leurs comportements de fuite et deviennent des proies à récompense de longueur. Les collisions entre les têtes et les corps sont aussi accélérées par hachage spatial; les bots morts se dispersent en orbes puis réapparaissent. Le boost consomme la longueur, la minimap et le classement suivent les positions et tailles, et le pseudo/record sont affichés dans l'interface. Le jeu garde les skins, les paramètres, la pause, le debug, les variantes de proies et les effets/pouvoirs de la version précédente. Le clic PLAY déclenche une transition cinématique avec cascade de spawn et compte à rebours; la mort produit un ralenti, une dispersion séquencée, des ondes de choc et un écran Game Over avec statistiques. Les effets audio sont synthétisés avec p5.sound. Le réglage monde et les délais des effets sont centralisés dans `GAME_CONFIG`.

La qualité de `3-Arrival` propose Low, Medium, High et Auto. Les presets règlent le nombre d'entités, la densité de rendu, les effets, le rythme d'affichage et le budget de particules; le mode Auto ajuste la qualité après mesure du jeu puis applique des temporisations anti-oscillation. La grille spatiale, le culling, les pools et la mise à jour décalée de l'IA limitent les coûts CPU/GPU sans retirer les mécaniques. Le diagnostic D/F3 expose les temps et compteurs; aucun gain de performance ne doit être annoncé comme mesuré sans benchmark sur une scène comparable.

`6-ObstacleAvoidance` présente un monde spatial ouvert de 4000 × 4000. `SpaceShip extends RoadVehicle` garde l'évitement hérité et `Vehicle.update()`; il remplace seulement l'orchestration de route par des waypoints, la séparation existante et une force douce de bordure. `Obstacle extends Vehicle` conserve sa hitbox circulaire. `OpenWorld`, `OpenSpaceCamera`, `OpenSpaceBackground`, `MiniMap`, `SpaceParticles` et `CinematicManager` séparent carte, caméra, décor, interface et cinématiques; les transitions ne modifient pas le pas physique des véhicules. La carte utilise une génération locale à seed, un pool d'obstacles et une grille spatiale. Les contrôles clavier sont affichés avec H.

`8-CosmicDelivery` est un mini-jeu autonome qui réutilise les scripts et comportements de `6-ObstacleAvoidance` sans modifier ses fichiers fournis. `DeliveryPlayer extends SpaceShip` vise la souris ou une direction clavier avec l'arrivée héritée; `DeliveryAsteroid extends Obstacle` ajoute le déplacement et l'évitement local des débris. Une zone de livraison fait progresser les niveaux, tandis que les collisions, trois vies, les bonus bouclier/ralentissement et la difficulté croissante restent orchestrés dans le `sketch.js` du jeu. Les tests se lancent avec `node --test 8-CosmicDelivery/tests/cosmic-delivery.test.mjs`.

Les tests de cet exemple sont dans `3-Arrival/tests/snake-game.test.mjs` et s'exécutent avec `node --test 3-Arrival/tests/snake-game.test.mjs`.

## Tests

Chaque nouvelle fonctionnalité d'un exemple doit être accompagnée de tests unitaires pertinents, exécutés avant de présenter la modification comme terminée. Consulter [`AGENTS.md`](AGENTS.md) pour les attentes de couverture, la reproductibilité de l'aléatoire et la communication du résultat des tests.
