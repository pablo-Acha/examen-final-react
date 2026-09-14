import type { Disc, LogEntry, MatchState, TeamId, Vec2 } from './types';
import {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  DISC_RADIUS,
  BALL_RADIUS,
  MAX_DRAG_DISTANCE,
  MAX_SHOT_SPEED,
  MIN_SHOT_SPEED,
  MAX_TURNS_PER_TEAM,
  WINNING_SCORE,
  TEAM_COLORS,
} from './constants';
import {
  integrate,
  resolveWalls,
  resolveCircleCollision,
  checkGoal,
  isMoving,
  sub,
  length,
  scale,
  type Body,
} from './physics';

let logCounter = 0;

/**
 * Genera la formación inicial de discos para una partida. `seed` introduce
 * variabilidad entre partidas (lineamiento 8): cada nueva partida separa
 * ligeramente las líneas de discos, así ninguna partida es idéntica a la
 * anterior aunque las reglas sean las mismas.
 */
function buildFormation(discsPerTeam: number, seed: number): Disc[] {
  const discs: Disc[] = [];
  const jitter = (n: number) => ((seed * 37 + n * 91) % 21) - 10; // -10..10 determinístico

  const columnFor = (team: TeamId, col: number) =>
    team === 'A'
      ? WALL_MARGIN_LOCAL + 90 + col * 70
      : FIELD_WIDTH - WALL_MARGIN_LOCAL - 90 - col * 70;

  const WALL_MARGIN_LOCAL = 24;

  (['A', 'B'] as TeamId[]).forEach((team) => {
    const rows = discsPerTeam;
    const spacing = (FIELD_HEIGHT - 140) / (rows + 1);
    for (let i = 0; i < rows; i++) {
      const row = i + 1;
      discs.push({
        id: `${team}-${i}`,
        team,
        pos: {
          x: columnFor(team, i % 2),
          y: 70 + spacing * row + jitter(i + (team === 'A' ? 0 : 100)),
        },
        vel: { x: 0, y: 0 },
        radius: DISC_RADIUS,
      });
    }
  });

  return discs;
}

export function createMatch(teamAName: string, teamBName: string, seed = Date.now()): MatchState {
  const discsPerTeam = 3;
  return {
    id: '',
    phase: 'start',
    teams: {
      A: { id: 'A', name: teamAName || 'Equipo A', color: TEAM_COLORS.A.color, colorDark: TEAM_COLORS.A.dark },
      B: { id: 'B', name: teamBName || 'Equipo B', color: TEAM_COLORS.B.color, colorDark: TEAM_COLORS.B.dark },
    },
    discs: buildFormation(discsPerTeam, seed),
    ball: { pos: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 }, vel: { x: 0, y: 0 }, radius: BALL_RADIUS },
    turn: seed % 2 === 0 ? 'A' : 'B',
    score: { A: 0, B: 0 },
    shotsTaken: { A: 0, B: 0 },
    config: { maxTurnsPerTeam: MAX_TURNS_PER_TEAM, discsPerTeam },
    selectedDiscId: null,
    log: [],
    winner: null,
    lastGoalTeam: null,
    seed,
  };
}

export function addLog(state: MatchState, text: string, tone: LogEntry['tone']): void {
  logCounter += 1;
  state.log = [{ id: logCounter, text, tone }, ...state.log].slice(0, 6);
}

function resetKickoff(state: MatchState, scoringTeam: TeamId | null): void {
  state.ball.pos = { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 };
  state.ball.vel = { x: 0, y: 0 };
  state.discs = buildFormation(state.config.discsPerTeam, state.seed + state.score.A + state.score.B + 1);
  // Saca el equipo que recibió el gol (regla clásica de fútbol).
  state.turn = scoringTeam === 'A' ? 'B' : scoringTeam === 'B' ? 'A' : state.turn;
}

/** Selecciona un disco propio para apuntar. Rechaza discos ajenos o fuera de turno. */
export function trySelectDisc(state: MatchState, discId: string): boolean {
  if (state.phase !== 'aiming') {
    addLog(state, 'Espera a que la jugada termine antes de elegir un disco.', 'invalid');
    return false;
  }
  const disc = state.discs.find((d) => d.id === discId);
  if (!disc) return false;
  if (disc.team !== state.turn) {
    addLog(state, `Ese disco es de ${state.teams[disc.team].name}: no es tu turno.`, 'invalid');
    return false;
  }
  state.selectedDiscId = discId;
  state.phase = 'dragging';
  return true;
}

export interface ShotResult {
  ok: boolean;
  reason?: string;
  velocity?: Vec2;
}

/**
 * Evalúa un arrastre sin tocar el estado: decide si el tiro se cancela
 * (arrastre insignificante), es inválido por débil, o es válido y calcula
 * la velocidad resultante. Se usa así, en dos pasos, para poder consultar
 * al servidor (turno/dueño del disco) ANTES de aplicar cualquier física.
 */
export function evaluateDrag(dragVector: Vec2): ShotResult {
  const dragLen = length(dragVector);
  if (dragLen < 12) {
    return { ok: false, reason: 'cancelled' };
  }
  const clamped = Math.min(dragLen, MAX_DRAG_DISTANCE);
  if (clamped < 20) {
    return { ok: false, reason: 'too-weak' };
  }
  const power = clamped / MAX_DRAG_DISTANCE;
  const speed = MIN_SHOT_SPEED + power * (MAX_SHOT_SPEED - MIN_SHOT_SPEED);
  const direction = scale(dragVector, -1 / dragLen); // se dispara en contra del arrastre (slingshot)
  return { ok: true, velocity: scale(direction, speed) };
}

/** Aplica una velocidad ya calculada al disco seleccionado y pasa a "resolving". */
export function applyVelocityToSelectedDisc(state: MatchState, velocity: Vec2): boolean {
  const disc = state.discs.find((d) => d.id === state.selectedDiscId);
  if (!disc) {
    state.phase = 'aiming';
    state.selectedDiscId = null;
    return false;
  }
  disc.vel = velocity;
  state.selectedDiscId = null;
  state.phase = 'resolving';
  return true;
}

/** Cancela la puntería en curso y vuelve a la fase de apuntar (sin consumir turno). */
export function cancelAim(state: MatchState, reason: string): void {
  if (reason === 'too-weak') {
    addLog(state, 'Tiro demasiado débil: el disco no se movió. Intenta de nuevo.', 'invalid');
  }
  state.phase = 'aiming';
  state.selectedDiscId = null;
}

/**
 * Flujo 100% local (usado por LocalGameClient): evalúa, aplica velocidad y
 * además lleva la cuenta de tiros/turno, ya que sin servidor alguien debe
 * hacerlo.
 */
export function releaseShot(state: MatchState, dragVector: Vec2): ShotResult {
  const evaluation = evaluateDrag(dragVector);
  if (!evaluation.ok || !evaluation.velocity) {
    cancelAim(state, evaluation.reason ?? 'cancelled');
    return evaluation;
  }
  applyVelocityToSelectedDisc(state, evaluation.velocity);
  state.shotsTaken[state.turn] += 1;
  return evaluation;
}

/** Un frame de simulación física. Devuelve true mientras algo siga en movimiento. */
export function stepSimulation(state: MatchState): { stillMoving: boolean; goalTeam: TeamId | null } {
  const bodies: Body[] = [...state.discs, state.ball];

  bodies.forEach((body) => integrate(body));

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      resolveCircleCollision(bodies[i], bodies[j]);
    }
  }

  bodies.forEach((body) => resolveWalls(body));

  const goalSide = checkGoal(state.ball);
  let goalTeam: TeamId | null = null;
  if (goalSide === 'left') goalTeam = 'B'; // entra por la izquierda: anota quien ataca hacia la izquierda (B)
  if (goalSide === 'right') goalTeam = 'A';

  const stillMoving = isMoving(bodies) && !goalTeam;
  return { stillMoving, goalTeam };
}

function endTurnOrSwitch(state: MatchState): void {
  state.turn = state.turn === 'A' ? 'B' : 'A';
}

export function resolveGoal(state: MatchState, scoringTeam: TeamId): void {
  state.score[scoringTeam] += 1;
  state.lastGoalTeam = scoringTeam;
  addLog(state, `¡Gol de ${state.teams[scoringTeam].name}! (${state.score.A} - ${state.score.B})`, 'goal');
  state.phase = 'goal';
}

/** Se llama tras la breve pausa de "goal" para reanudar el juego o terminarlo. */
export function continueAfterGoal(state: MatchState): void {
  const scoringTeam = state.lastGoalTeam;
  if (checkMatchEnd(state)) return;
  resetKickoff(state, scoringTeam);
  state.lastGoalTeam = null;
  state.phase = 'aiming';
  addLog(state, `Saca ${state.teams[state.turn].name}.`, 'turn');
}

/** Sin gol: termina el turno del jugador y verifica fin de partido por límite de tiros. */
export function finishTurnWithoutGoal(state: MatchState): void {
  if (checkMatchEnd(state)) return;
  endTurnOrSwitch(state);
  state.phase = 'aiming';
  addLog(state, `Turno de ${state.teams[state.turn].name}.`, 'turn');
}

function checkMatchEnd(state: MatchState): boolean {
  if (state.score.A >= WINNING_SCORE || state.score.B >= WINNING_SCORE) {
    state.winner = state.score.A > state.score.B ? 'A' : 'B';
    state.phase = 'finished';
    addLog(state, `Fin del partido: gana ${state.teams[state.winner].name}.`, 'goal');
    return true;
  }
  const turnsExhausted =
    state.shotsTaken.A >= state.config.maxTurnsPerTeam && state.shotsTaken.B >= state.config.maxTurnsPerTeam;
  if (turnsExhausted) {
    if (state.score.A === state.score.B) {
      state.winner = 'draw';
      addLog(state, 'Fin del partido: empate por límite de tiros.', 'goal');
    } else {
      state.winner = state.score.A > state.score.B ? 'A' : 'B';
      addLog(state, `Fin del partido: gana ${state.teams[state.winner].name}.`, 'goal');
    }
    state.phase = 'finished';
    return true;
  }
  return false;
}

export function distanceVec(a: Vec2, b: Vec2): Vec2 {
  return sub(a, b);
}
