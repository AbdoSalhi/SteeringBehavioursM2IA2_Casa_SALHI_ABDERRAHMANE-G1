let obstacleSpatialGrid = null;
const OBSTACLE_QUERY_BUFFER = [];

function indexObstacles(obstacles) {
  if (!obstacleSpatialGrid) obstacleSpatialGrid = new SpatialGrid(GAME_CONFIG.spatialCellSize);
  obstacleSpatialGrid.clear();
  for (const obstacle of obstacles) obstacleSpatialGrid.insert(obstacle);
}

function fleeForce(agent, target) {
  const desired = agent.steeringDesired || (agent.steeringDesired = createVector(0, 0));
  desired.set(agent.pos.x - target.pos.x, agent.pos.y - target.pos.y);
  if (desired.magSq() < 0.001) desired.set(1, 0);
  desired.setMag(agent.maxSpeed);
  const result = agent.steeringResult || (agent.steeringResult = createVector(0, 0));
  return result.set(desired).sub(agent.vel).limit(agent.maxForce);
}

function obstacleAvoidance(agent, obstacles, lookAhead = 90) {
  let closest = null;
  let closestDistance = Infinity;
  const forward = agent.avoidanceForward || (agent.avoidanceForward = createVector(0, 0));
  forward.set(agent.vel);
  if (forward.mag() < 0.1) forward.set(1, 0);
  forward.setMag(lookAhead);
  const aheadX = agent.pos.x + forward.x;
  const aheadY = agent.pos.y + forward.y;

  const candidates = OBSTACLE_QUERY_BUFFER;
  if (obstacleSpatialGrid) {
    obstacleSpatialGrid.queryInto(agent.pos, lookAhead + agent.r + 50, candidates);
  } else {
    candidates.length = 0;
    for (const obstacle of obstacles) candidates.push(obstacle);
  }
  for (const obstacle of candidates) {
    const dx = aheadX - obstacle.pos.x;
    const dy = aheadY - obstacle.pos.y;
    const combinedRadius = obstacle.r + agent.r + 14;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq < combinedRadius * combinedRadius && distanceSq < closestDistance) {
      closest = obstacle;
      closestDistance = distanceSq;
    }
  }

  const result = agent.avoidanceResult || (agent.avoidanceResult = createVector(0, 0));
  if (!closest) return result.set(0, 0);
  const away = agent.steeringDesired || (agent.steeringDesired = createVector(0, 0));
  away.set(agent.pos.x - closest.pos.x, agent.pos.y - closest.pos.y);
  if (away.magSq() < 0.001) away.set(-forward.y, forward.x);
  away.setMag(agent.maxSpeed);
  return result.set(away).sub(agent.vel).limit(agent.maxForce);
}

function boundaryForce(agent, margin = 40) {
  const desired = agent.boundaryDesired || (agent.boundaryDesired = createVector(0, 0));
  const result = agent.boundaryResult || (agent.boundaryResult = createVector(0, 0));
  desired.set(0, 0);
  if (agent.pos.x < margin) desired.x = agent.maxSpeed;
  else if (agent.pos.x > width - margin) desired.x = -agent.maxSpeed;
  if (agent.pos.y < margin) desired.y = agent.maxSpeed;
  else if (agent.pos.y > height - margin) desired.y = -agent.maxSpeed;
  if (desired.magSq() === 0) return result.set(0, 0);
  desired.setMag(agent.maxSpeed);
  return result.set(desired).sub(agent.vel).limit(agent.maxForce);
}
