import { useEffect, useRef } from 'react';
import type { MatchState, Vec2 } from '../game/types';
import { addLog, stepSimulation } from '../game/engine';
import { gameClient } from '../services/gameClient';
import {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  WALL_MARGIN,
  GOAL_WIDTH,
  GOAL_DEPTH,
  MAX_DRAG_DISTANCE,
} from '../game/constants';

interface DragInfo {
  discId: string;
  start: Vec2;
  current: Vec2;
}

interface Props {
  stateRef: React.MutableRefObject<MatchState>;
  onSync: () => void;
}

export default function GameCanvas({ stateRef, onSync }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<DragInfo | null>(null);
  const rafRef = useRef<number | null>(null);
  const goalTimeoutRef = useRef<number | null>(null);

  // Bucle de animación: corre siempre, dibuja cada frame y avanza la
  // física únicamente mientras la fase es "resolving".
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let resolutionPending = false;

    function showResolutionError() {
      // No reenviamos una operación cuyo resultado en el servidor es incierto.
      addLog(stateRef.current, 'No se pudo confirmar el resultado. Recarga para iniciar otra partida.', 'invalid');
      onSync();
    }

    function loop() {
      const state = stateRef.current;

      if (state.phase === 'resolving' && !resolutionPending) {
        const { stillMoving, goalTeam } = stepSimulation(state);
        if (goalTeam) {
          resolutionPending = true;
          void gameClient.reportResolution(state, { goalTeam }).then(() => {
            const nextPhase = state.phase; // ya autoritativo: 'aiming' o 'finished'
            state.phase = 'goal';
            resolutionPending = false;
            onSync();
            goalTimeoutRef.current = window.setTimeout(() => {
              void gameClient.continueAfterGoal(state).then(() => {
                state.phase = nextPhase;
                onSync();
              });
            }, 1300);
          }).catch(showResolutionError);
        } else if (!stillMoving) {
          resolutionPending = true;
          void gameClient.reportResolution(state, { goalTeam: null }).then(() => {
            resolutionPending = false;
            onSync();
          }).catch(showResolutionError);
        }
      }

      draw(ctx!, state, dragRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (goalTimeoutRef.current) window.clearTimeout(goalTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toFieldCoords(clientX: number, clientY: number): Vec2 {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * FIELD_WIDTH,
      y: ((clientY - rect.top) / rect.height) * FIELD_HEIGHT,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const state = stateRef.current;
    if (state.phase !== 'aiming') return;
    const pos = toFieldCoords(e.clientX, e.clientY);
    const disc = state.discs.find((d) => {
      const dx = d.pos.x - pos.x;
      const dy = d.pos.y - pos.y;
      return Math.hypot(dx, dy) <= d.radius + 10;
    });
    if (!disc) return;

    void gameClient.selectDisc(state, disc.id).then((ok) => {
      if (!ok) {
        onSync();
        return;
      }
      dragRef.current = { discId: disc.id, start: disc.pos, current: pos };
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      onSync();
    });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current) return;
    dragRef.current.current = toFieldCoords(e.clientX, e.clientY);
  }

  function handlePointerUp() {
    const drag = dragRef.current;
    if (!drag) return;
    const state = stateRef.current;
    const dragVector: Vec2 = {
      x: drag.current.x - drag.start.x,
      y: drag.current.y - drag.start.y,
    };
    dragRef.current = null;
    void gameClient.submitShot(state, { discId: drag.discId, dragVector }).then(() => onSync());
  }

  return (
    <canvas
      ref={canvasRef}
      className="pitch-canvas"
      width={FIELD_WIDTH}
      height={FIELD_HEIGHT}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}

function draw(ctx: CanvasRenderingContext2D, state: MatchState, drag: DragInfo | null) {
  ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);

  drawPitch(ctx);

  // Discos
  state.discs.forEach((disc) => {
    const team = state.teams[disc.team];
    const isSelected = state.selectedDiscId === disc.id;
    ctx.beginPath();
    ctx.arc(disc.pos.x, disc.pos.y, disc.radius, 0, Math.PI * 2);
    ctx.fillStyle = team.color;
    ctx.fill();
    ctx.lineWidth = isSelected ? 4 : 2;
    ctx.strokeStyle = isSelected ? '#FFB703' : team.colorDark;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(disc.pos.x, disc.pos.y, disc.radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = team.colorDark;
    ctx.fill();
  });

  // Balón
  ctx.beginPath();
  ctx.arc(state.ball.pos.x, state.ball.pos.y, state.ball.radius, 0, Math.PI * 2);
  ctx.fillStyle = '#F1FAEE';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#0D1B14';
  ctx.stroke();

  // Línea/elástico de puntería
  if (drag) {
    const disc = state.discs.find((d) => d.id === drag.discId);
    if (disc) {
      const dx = drag.current.x - drag.start.x;
      const dy = drag.current.y - drag.start.y;
      const dist = Math.min(Math.hypot(dx, dy), MAX_DRAG_DISTANCE);
      const power = dist / MAX_DRAG_DISTANCE;
      const angle = Math.atan2(dy, dx);
      const aimX = disc.pos.x - Math.cos(angle) * dist;
      const aimY = disc.pos.y - Math.sin(angle) * dist;

      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = `rgba(255, 183, 3, ${0.5 + power * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(disc.pos.x, disc.pos.y);
      ctx.lineTo(aimX, aimY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Punta de flecha en dirección real del disparo (opuesta al arrastre)
      const shootAngle = angle + Math.PI;
      const tipX = disc.pos.x + Math.cos(shootAngle) * (disc.radius + 14 + power * 26);
      const tipY = disc.pos.y + Math.sin(shootAngle) * (disc.radius + 14 + power * 26);
      ctx.beginPath();
      ctx.arc(tipX, tipY, 4 + power * 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFB703';
      ctx.fill();
    }
  }
}

function drawPitch(ctx: CanvasRenderingContext2D) {
  // Franjas de césped cortado, alternando tono.
  const stripeCount = 10;
  const stripeWidth = FIELD_WIDTH / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#1B4332' : '#204A38';
    ctx.fillRect(i * stripeWidth, 0, stripeWidth, FIELD_HEIGHT);
  }

  ctx.strokeStyle = 'rgba(241, 250, 238, 0.85)';
  ctx.lineWidth = 3;

  // Borde de cancha
  ctx.strokeRect(WALL_MARGIN, WALL_MARGIN, FIELD_WIDTH - WALL_MARGIN * 2, FIELD_HEIGHT - WALL_MARGIN * 2);

  // Línea media + círculo central
  ctx.beginPath();
  ctx.moveTo(FIELD_WIDTH / 2, WALL_MARGIN);
  ctx.lineTo(FIELD_WIDTH / 2, FIELD_HEIGHT - WALL_MARGIN);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(241, 250, 238, 0.85)';
  ctx.fill();

  const goalTop = FIELD_HEIGHT / 2 - GOAL_WIDTH / 2;

  // Arcos (izquierdo y derecho), dibujados como una boca abierta hacia afuera.
  [0, FIELD_WIDTH].forEach((side) => {
    const dir = side === 0 ? 1 : -1;
    ctx.strokeRect(
      side === 0 ? WALL_MARGIN - GOAL_DEPTH : FIELD_WIDTH - WALL_MARGIN,
      goalTop,
      GOAL_DEPTH,
      GOAL_WIDTH
    );
    ctx.beginPath();
    ctx.moveTo(side + dir * WALL_MARGIN, WALL_MARGIN);
    ctx.lineTo(side + dir * (WALL_MARGIN + 60), WALL_MARGIN + 60);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(side + dir * WALL_MARGIN, FIELD_HEIGHT - WALL_MARGIN);
    ctx.lineTo(side + dir * (WALL_MARGIN + 60), FIELD_HEIGHT - WALL_MARGIN - 60);
    ctx.stroke();
  });
}
