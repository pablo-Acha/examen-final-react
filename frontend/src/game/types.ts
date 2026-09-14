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

export type MatchPhase =
  | 'start'      // pantalla de inicio, equipos aún no confirmados
  | 'aiming'     // el jugador en turno puede arrastrar un disco propio
  | 'dragging'   // el jugador está arrastrando (definiendo tiro)
  | 'resolving'  // la física corre sola hasta que todo se detiene
  | 'goal'       // pausa breve mostrando el gol antes de reanudar
  | 'finished';  // partido terminado

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
  maxTurnsPerTeam: number; // límite de disparos por equipo -> condición de empate/fin
  discsPerTeam: number;
}

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
  lastGoalTeam: TeamId | null;
  seed: number; // usado para variabilidad entre partidas (formación / kickoff)
}
