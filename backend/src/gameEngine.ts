import type { Disc, LogEntry, MatchState, TeamId } from './types';
import {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  WALL_MARGIN,
  DISC_RADIUS,
  BALL_RADIUS,
  WINNING_SCORE,
  MAX_TURNS_PER_TEAM,
  TEAM_COLORS,
} from './constants';

let logCounter = 0;

function buildFormation(discsPerTeam: number, seed: number): Disc[] {
  const discs: Disc[] = [];
  const jitter = (n: number) => ((seed * 37 + n * 91) % 21) - 10;

  const columnFor = (team: TeamId, col: number) =>
    team === 'A' ? WALL_MARGIN + 90 + col * 70 : FIELD_WIDTH - WALL_MARGIN - 90 - col * 70;

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

function addLog(state: MatchState, text: string, tone: LogEntry['tone']): void {
  logCounter += 1;
  state.log = [{ id: logCounter, text, tone }, ...state.log].slice(0, 10);
}

/**
 * Decisión del servidor #1: crea la partida. El servidor elige la semilla,
 * quién saca primero y genera la formación inicial — el cliente no puede
 * imponer ninguno de estos valores.
 */
export function createMatch(id: string, teamAName: string, teamBName: string): MatchState {
  const seed = Date.now();
  const discsPerTeam = 3;
  const now = Date.now();

  const state: MatchState = {
    id,
    phase: 'aiming',
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
    seed,
    createdAt: now,
    updatedAt: now,
  };

  addLog(state, `Partido creado. Saca ${state.teams[state.turn].name}.`, 'turn');
  return state;
}

export interface ShotValidation {
  ok: boolean;
  reason?: string;
  status: number;
}

/**
 * Decisión del servidor #2: valida el tiro antes de que el frontend simule
 * la física. Comprueba que la partida esté en fase de apuntar, que el disco
 * exista y que pertenezca al equipo cuyo turno es. Si es válido, cuenta el
 * tiro y pasa la partida a "resolving".
 */
export function validateAndRegisterShot(state: MatchState, discId: string): ShotValidation {
  if (state.phase === 'finished') {
    return { ok: false, reason: 'match-finished', status: 409 };
  }
  if (state.phase !== 'aiming') {
    return { ok: false, reason: 'not-aiming-phase', status: 409 };
  }
  const disc = state.discs.find((d) => d.id === discId);
  if (!disc) {
    return { ok: false, reason: 'unknown-disc', status: 400 };
  }
  if (disc.team !== state.turn) {
    addLog(state, `Tiro rechazado: ese disco no es de ${state.teams[state.turn].name}.`, 'invalid');
    state.updatedAt = Date.now();
    return { ok: false, reason: 'not-your-turn', status: 403 };
  }

  state.shotsTaken[state.turn] += 1;
  state.selectedDiscId = discId;
  state.phase = 'resolving';
  state.updatedAt = Date.now();
  return { ok: true, status: 200 };
}

function resetKickoff(state: MatchState, scoringTeam: TeamId | null): void {
  state.ball = { pos: { x: FIELD_WIDTH / 2, y: FIELD_HEIGHT / 2 }, vel: { x: 0, y: 0 }, radius: BALL_RADIUS };
  state.discs = buildFormation(state.config.discsPerTeam, state.seed + state.score.A + state.score.B + 1);
  if (scoringTeam) {
    state.turn = scoringTeam === 'A' ? 'B' : 'A'; // saca quien recibió el gol
  }
}

function checkMatchEnd(state: MatchState): boolean {
  if (state.score.A >= WINNING_SCORE || state.score.B >= WINNING_SCORE) {
    state.winner = state.score.A > state.score.B ? 'A' : 'B';
    state.phase = 'finished';
    addLog(state, `Fin del partido: gana ${state.teams[state.winner].name}.`, 'goal');
    return true;
  }
  const exhausted =
    state.shotsTaken.A >= state.config.maxTurnsPerTeam && state.shotsTaken.B >= state.config.maxTurnsPerTeam;
  if (exhausted) {
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

export interface ResolutionResult {
  state: MatchState;
  resetFormation: boolean;
}

/**
 * Decisión del servidor #3: recibe el resultado físico final que simuló el
 * frontend (hubo gol o no) y decide, de forma autoritativa, el marcador
 * nuevo, de quién es el siguiente turno y si el partido terminó.
 */
export function resolveOutcome(state: MatchState, goalTeam: TeamId | null): ResolutionResult {
  if (goalTeam) {
    state.score[goalTeam] += 1;
    addLog(state, `¡Gol de ${state.teams[goalTeam].name}! (${state.score.A} - ${state.score.B})`, 'goal');
    if (checkMatchEnd(state)) {
      return { state, resetFormation: false };
    }
    resetKickoff(state, goalTeam);
    state.phase = 'aiming';
    state.selectedDiscId = null;
    addLog(state, `Saca ${state.teams[state.turn].name}.`, 'turn');
    state.updatedAt = Date.now();
    return { state, resetFormation: true };
  }

  if (checkMatchEnd(state)) {
    return { state, resetFormation: false };
  }
  state.turn = state.turn === 'A' ? 'B' : 'A';
  state.phase = 'aiming';
  state.selectedDiscId = null;
  addLog(state, `Turno de ${state.teams[state.turn].name}.`, 'turn');
  state.updatedAt = Date.now();
  return { state, resetFormation: false };
}
