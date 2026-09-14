import type { MatchState, TeamId, Vec2 } from '../game/types';
import {
  createMatch,
  trySelectDisc,
  evaluateDrag,
  applyVelocityToSelectedDisc,
  cancelAim,
  resolveGoal,
  continueAfterGoal,
  finishTurnWithoutGoal,
  addLog,
} from '../game/engine';

/**
 * Contrato compartido entre la implementación local (sin red, usada como
 * respaldo/demo) y la implementación real que habla con Express por fetch.
 * Los componentes de React sólo conocen esta interfaz.
 */
export interface CreateMatchRequest {
  teamAName: string;
  teamBName: string;
}

export interface ShotRequest {
  discId: string;
  dragVector: Vec2;
}

export interface ShotResponse {
  accepted: boolean;
  reason?: string;
}

export interface ResolutionReport {
  goalTeam: TeamId | null;
}

export interface GameClient {
  createMatch(req: CreateMatchRequest): Promise<MatchState>;
  selectDisc(state: MatchState, discId: string): Promise<boolean>;
  submitShot(state: MatchState, req: ShotRequest): Promise<ShotResponse>;
  reportResolution(state: MatchState, report: ResolutionReport): Promise<MatchState>;
  continueAfterGoal(state: MatchState): Promise<MatchState>;
}

/**
 * Cliente real: usa fetch nativo contra el backend Express, montado bajo
 * `/api/matches`. En desarrollo, Vite redirige esa ruta al servidor Express
 * (ver vite.config.ts); en producción, Express sirve el frontend compilado
 * desde el mismo dominio y puerto, así que las rutas relativas funcionan
 * sin configuración adicional.
 */
export class RemoteGameClient implements GameClient {
  private base = '/api/matches';

  async createMatch(req: CreateMatchRequest): Promise<MatchState> {
    const res = await fetch(this.base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`No se pudo crear la partida (HTTP ${res.status})`);
    return res.json();
  }

  // La selección de disco es una comprobación local instantánea (para que
  // apuntar se sienta inmediato); la validación que de verdad importa
  // ocurre en submitShot, cuando el tiro ya es una acción consumada.
  async selectDisc(state: MatchState, discId: string): Promise<boolean> {
    return trySelectDisc(state, discId);
  }

  async submitShot(state: MatchState, req: ShotRequest): Promise<ShotResponse> {
    const evaluation = evaluateDrag(req.dragVector);
    if (!evaluation.ok || !evaluation.velocity) {
      cancelAim(state, evaluation.reason ?? 'cancelled');
      return { accepted: false, reason: evaluation.reason };
    }

    const res = await fetch(`${this.base}/${state.id}/shots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discId: req.discId }),
    });
    const data = await res.json();

    if (!res.ok || !data.accepted) {
      // El servidor rechazó el tiro (turno equivocado, disco ajeno, etc.):
      // no se aplica ninguna física, se vuelve a "aiming".
      state.phase = 'aiming';
      state.selectedDiscId = null;
      addLog(state, 'El servidor rechazó el tiro: no era tu turno.', 'invalid');
      return { accepted: false, reason: data.reason };
    }

    // El servidor ya contó el tiro y validó el turno: recién ahora se
    // aplica la velocidad y arranca la simulación física en el cliente.
    applyVelocityToSelectedDisc(state, evaluation.velocity);
    state.shotsTaken = data.state.shotsTaken;
    state.log = data.state.log;
    return { accepted: true };
  }

  async reportResolution(state: MatchState, report: ResolutionReport): Promise<MatchState> {
    const res = await fetch(`${this.base}/${state.id}/resolution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });
    if (!res.ok) throw new Error(`No se pudo reportar el resultado (HTTP ${res.status})`);
    const data: { state: MatchState; resetFormation: boolean } = await res.json();

    // El marcador, turno, historial y fin de partido son autoritativos del
    // servidor. La formación de discos sólo se reemplaza por la del
    // servidor cuando hubo gol (saque nuevo); si no, el cliente conserva
    // las posiciones donde la física los dejó.
    state.phase = data.state.phase;
    state.turn = data.state.turn;
    state.score = data.state.score;
    state.shotsTaken = data.state.shotsTaken;
    state.log = data.state.log;
    state.winner = data.state.winner;
    state.selectedDiscId = data.state.selectedDiscId;
    if (report.goalTeam) {
      state.score[report.goalTeam] = data.state.score[report.goalTeam];
    }
    if (data.resetFormation) {
      state.discs = data.state.discs;
      state.ball = data.state.ball;
    }
    return state;
  }

  async continueAfterGoal(state: MatchState): Promise<MatchState> {
    // El servidor ya dejó lista la formación/turno siguiente dentro de
    // reportResolution; aquí sólo se libera la pausa visual del "gol".
    return state;
  }
}

/** Respaldo sin red: corre las mismas reglas en el navegador. Útil para
 * probar la interfaz sin el backend levantado. */
export class LocalGameClient implements GameClient {
  async createMatch(req: CreateMatchRequest): Promise<MatchState> {
    return createMatch(req.teamAName, req.teamBName, Date.now());
  }

  async selectDisc(state: MatchState, discId: string): Promise<boolean> {
    return trySelectDisc(state, discId);
  }

  async submitShot(state: MatchState, req: ShotRequest): Promise<ShotResponse> {
    const evaluation = evaluateDrag(req.dragVector);
    if (!evaluation.ok || !evaluation.velocity) {
      cancelAim(state, evaluation.reason ?? 'cancelled');
      return { accepted: false, reason: evaluation.reason };
    }
    applyVelocityToSelectedDisc(state, evaluation.velocity);
    state.shotsTaken[state.turn] += 1;
    return { accepted: true };
  }

  async reportResolution(state: MatchState, report: ResolutionReport): Promise<MatchState> {
    if (report.goalTeam) {
      resolveGoal(state, report.goalTeam);
    } else {
      finishTurnWithoutGoal(state);
    }
    return state;
  }

  async continueAfterGoal(state: MatchState): Promise<MatchState> {
    continueAfterGoal(state);
    return state;
  }
}

export const gameClient: GameClient = new RemoteGameClient();
