import type { Vec2 } from './types';
import {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  WALL_MARGIN,
  GOAL_WIDTH,
  GOAL_DEPTH,
  FRICTION,
  MIN_SPEED,
  RESTITUTION,
  WALL_RESTITUTION,
} from './constants';

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(a: Vec2, s: number): Vec2 {
  return { x: a.x * s, y: a.y * s };
}

export function length(a: Vec2): number {
  return Math.hypot(a.x, a.y);
}

export function normalize(a: Vec2): Vec2 {
  const len = length(a);
  if (len === 0) return { x: 0, y: 0 };
  return { x: a.x / len, y: a.y / len };
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

/** Movable circular body shared shape for discs and the ball. */
export interface Body {
  pos: Vec2;
  vel: Vec2;
  radius: number;
}

/** Avanza una sola partícula un frame: fricción + integración de posición. */
export function integrate(body: Body): void {
  const speed = length(body.vel);
  if (speed < MIN_SPEED) {
    body.vel = { x: 0, y: 0 };
    return;
  }
  body.vel = scale(body.vel, FRICTION);
  body.pos = add(body.pos, body.vel);
}

/**
 * Resuelve rebotes contra las paredes de la cancha. La boca del arco
 * (a la izquierda y a la derecha) queda abierta: si el cuerpo entra por ahí
 * no rebota, sigue de largo (para permitir el gol). El llamador es quien
 * detecta el gol comparando la posición contra GOAL_DEPTH.
 */
export function resolveWalls(body: Body): void {
  const top = WALL_MARGIN + body.radius;
  const bottom = FIELD_HEIGHT - WALL_MARGIN - body.radius;
  const left = WALL_MARGIN + body.radius;
  const right = FIELD_WIDTH - WALL_MARGIN - body.radius;

  const goalTop = FIELD_HEIGHT / 2 - GOAL_WIDTH / 2;
  const goalBottom = FIELD_HEIGHT / 2 + GOAL_WIDTH / 2;
  const insideGoalMouth = body.pos.y > goalTop && body.pos.y < goalBottom;

  if (body.pos.y < top) {
    body.pos.y = top;
    body.vel.y = -body.vel.y * WALL_RESTITUTION;
  } else if (body.pos.y > bottom) {
    body.pos.y = bottom;
    body.vel.y = -body.vel.y * WALL_RESTITUTION;
  }

  // Paredes laterales, salvo si el cuerpo está cruzando por la boca del arco
  // (ahí se deja avanzar hasta la línea de fondo del arco, ver GOAL_DEPTH).
  if (!insideGoalMouth) {
    if (body.pos.x < left) {
      body.pos.x = left;
      body.vel.x = -body.vel.x * WALL_RESTITUTION;
    } else if (body.pos.x > right) {
      body.pos.x = right;
      body.vel.x = -body.vel.x * WALL_RESTITUTION;
    }
  } else {
    const goalLineLeft = WALL_MARGIN - GOAL_DEPTH + body.radius;
    const goalLineRight = FIELD_WIDTH - WALL_MARGIN + GOAL_DEPTH - body.radius;
    if (body.pos.x < goalLineLeft) {
      body.pos.x = goalLineLeft;
      body.vel.x = -body.vel.x * WALL_RESTITUTION;
    } else if (body.pos.x > goalLineRight) {
      body.pos.x = goalLineRight;
      body.vel.x = -body.vel.x * WALL_RESTITUTION;
    }
  }
}

/** true si el cuerpo cruzó completamente la línea de gol de un lado u otro. */
export function checkGoal(body: Body): 'left' | 'right' | null {
  const goalTop = FIELD_HEIGHT / 2 - GOAL_WIDTH / 2;
  const goalBottom = FIELD_HEIGHT / 2 + GOAL_WIDTH / 2;
  const insideGoalMouth = body.pos.y > goalTop && body.pos.y < goalBottom;
  if (!insideGoalMouth) return null;
  if (body.pos.x < WALL_MARGIN - GOAL_DEPTH + body.radius + 2) return 'left';
  if (body.pos.x > FIELD_WIDTH - WALL_MARGIN + GOAL_DEPTH - body.radius - 2) return 'right';
  return null;
}

/** Colisión elástica circular entre dos cuerpos (masas iguales). */
export function resolveCircleCollision(a: Body, b: Body): boolean {
  const delta = sub(b.pos, a.pos);
  const dist = length(delta);
  const minDist = a.radius + b.radius;
  if (dist === 0 || dist >= minDist) return false;

  const normal = normalize(delta);
  const overlap = minDist - dist;

  // Separar los cuerpos para que no queden encimados.
  a.pos = sub(a.pos, scale(normal, overlap / 2));
  b.pos = add(b.pos, scale(normal, overlap / 2));

  // Intercambio de velocidad a lo largo de la normal (masas iguales),
  // conservando la componente tangencial.
  const relVel = sub(b.vel, a.vel);
  const velAlongNormal = dot(relVel, normal);
  if (velAlongNormal > 0) return true; // ya se están separando

  const impulse = -(1 + RESTITUTION) * velAlongNormal * 0.5;
  const impulseVec = scale(normal, impulse);
  a.vel = sub(a.vel, impulseVec);
  b.vel = add(b.vel, impulseVec);
  return true;
}

export function isMoving(bodies: Body[]): boolean {
  return bodies.some((body) => length(body.vel) >= MIN_SPEED);
}
