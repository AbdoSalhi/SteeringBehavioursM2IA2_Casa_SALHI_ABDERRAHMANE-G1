function selectMissileTarget(pursuer, targets, decoys) {
  const candidates = decoys.length > 0 ? decoys : targets;
  let nearest = null;
  let nearestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = p5.Vector.dist(pursuer.pos, candidate.pos);
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return nearest;
}
