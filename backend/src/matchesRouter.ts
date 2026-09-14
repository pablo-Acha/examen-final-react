import { Router, type Request, type Response } from 'express';
import { randomUUID } from 'crypto';
import { createMatch, validateAndRegisterShot, resolveOutcome } from './gameEngine';
import { saveMatch, getMatch } from './store';
import type { TeamId } from './types';

export const matchesRouter = Router();

function isTeamIdOrNull(value: unknown): value is TeamId | null {
  return value === 'A' || value === 'B' || value === null;
}

// POST /api/matches — crea la partida. El servidor decide la semilla, quién
// saca primero y la formación inicial de los discos.
matchesRouter.post('/', (req: Request, res: Response) => {
  const { teamAName, teamBName } = req.body ?? {};
  if (teamAName !== undefined && typeof teamAName !== 'string') {
    return res.status(400).json({ error: 'teamAName debe ser un texto' });
  }
  if (teamBName !== undefined && typeof teamBName !== 'string') {
    return res.status(400).json({ error: 'teamBName debe ser un texto' });
  }

  const id = randomUUID();
  const state = createMatch(id, teamAName ?? '', teamBName ?? '');
  saveMatch(state);
  return res.status(201).json(state);
});

// GET /api/matches/:id — devuelve el estado actual de la partida.
matchesRouter.get('/:id', (req: Request, res: Response) => {
  const state = getMatch(String(req.params.id));
  if (!state) {
    return res.status(404).json({ error: 'Partida no encontrada' });
  }
  return res.json(state);
});

// GET /api/matches/:id/history — devuelve únicamente el historial de eventos.
matchesRouter.get('/:id/history', (req: Request, res: Response) => {
  const state = getMatch(String(req.params.id));
  if (!state) {
    return res.status(404).json({ error: 'Partida no encontrada' });
  }
  return res.json({ log: state.log });
});

// POST /api/matches/:id/shots — valida turno y dueño del disco ANTES de que
// el frontend simule el disparo. Esta es la decisión de servidor que impide
// que un jugador mueva un disco ajeno o dispare fuera de su turno.
matchesRouter.post('/:id/shots', (req: Request, res: Response) => {
  const state = getMatch(String(req.params.id));
  if (!state) {
    return res.status(404).json({ error: 'Partida no encontrada' });
  }

  const { discId } = req.body ?? {};
  if (typeof discId !== 'string') {
    return res.status(400).json({ error: 'discId es requerido' });
  }

  const result = validateAndRegisterShot(state, discId);
  saveMatch(state);

  if (!result.ok) {
    return res.status(result.status).json({ accepted: false, reason: result.reason, state });
  }
  return res.status(200).json({ accepted: true, state });
});

// POST /api/matches/:id/resolution — el frontend reporta el resultado
// físico final (gol o no); el servidor decide marcador, turno y si el
// partido terminó.
matchesRouter.post('/:id/resolution', (req: Request, res: Response) => {
  const state = getMatch(String(req.params.id));
  if (!state) {
    return res.status(404).json({ error: 'Partida no encontrada' });
  }
  if (state.phase !== 'resolving') {
    return res.status(409).json({ error: 'No hay un tiro en curso para resolver' });
  }

  const { goalTeam } = req.body ?? {};
  if (!isTeamIdOrNull(goalTeam)) {
    return res.status(400).json({ error: "goalTeam debe ser 'A', 'B' o null" });
  }

  const result = resolveOutcome(state, goalTeam);
  saveMatch(result.state);
  return res.status(200).json(result);
});
