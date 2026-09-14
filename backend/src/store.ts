import type { MatchState } from './types';

// Almacenamiento en memoria: suficiente para el alcance del examen (una
// única instancia del servidor). Si se necesitara persistencia real entre
// reinicios, este archivo es el único lugar que habría que cambiar por una
// base de datos.
const matches = new Map<string, MatchState>();

export function saveMatch(state: MatchState): void {
  matches.set(state.id, state);
}

export function getMatch(id: string): MatchState | undefined {
  return matches.get(id);
}

export function deleteMatch(id: string): void {
  matches.delete(id);
}
