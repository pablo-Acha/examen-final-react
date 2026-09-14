export type TeamId = 'A' | 'B';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Disc {
  id: string;
  team: TeamId;
  pos: Vec2;
  vel: Vec2;
  radius: number;
}

export interface Ball {
  pos: Vec2;
  vel: Vec2;
  radius: number;
}

export type MatchPhase = 'aiming' | 'resolving' | 'finished';

export interface TeamInfo {
  id: TeamId;
  name: string;
  color: string;
  colorDark: string;
}

export interface LogEntry {
  id: number;
  text: string;
  tone: 'info' | 'goal' | 'invalid' | 'turn';
}

export interface MatchConfig {
  maxTurnsPerTeam: number;
  discsPerTeam: number;
}

/**
 * Estado autoritativo que vive en el servidor. Tiene la misma forma que el
 * `MatchState` del frontend (para que la respuesta JSON se pueda usar sin
 * transformar), pero el servidor nunca simula física cuadro a cuadro: sólo
 * decide formación inicial, valida turnos/dueño del disco, calcula el
 * resultado (gol o no) y mantiene marcador, turno e historial.
 */
export interface MatchState {
  id: string;
  phase: MatchPhase;
  teams: Record<TeamId, TeamInfo>;
  discs: Disc[];
  ball: Ball;
  turn: TeamId;
  score: Record<TeamId, number>;
  shotsTaken: Record<TeamId, number>;
  config: MatchConfig;
  selectedDiscId: string | null;
  log: LogEntry[];
  winner: TeamId | 'draw' | null;
  seed: number;
  createdAt: number;
  updatedAt: number;
}
