// Todas las medidas son "unidades de cancha" en un sistema de coordenadas
// fijo (FIELD_WIDTH x FIELD_HEIGHT). El canvas se escala para llenar la
// pantalla, así el juego ocupa siempre toda el área visible sin importar
// el tamaño real de la ventana.
export const FIELD_WIDTH = 1000;
export const FIELD_HEIGHT = 600;

export const WALL_MARGIN = 24;
export const GOAL_WIDTH = 180; // ancho de la boca del arco, centrado verticalmente
export const GOAL_DEPTH = 26;

export const DISC_RADIUS = 22;
export const BALL_RADIUS = 13;

export const FRICTION = 0.986; // factor multiplicativo de desaceleración por frame
export const MIN_SPEED = 4; // por debajo de esto, se considera detenido
export const MAX_DRAG_DISTANCE = 160; // distancia de arrastre que produce potencia máxima
export const MAX_SHOT_SPEED = 34;
export const MIN_SHOT_SPEED = 3; // arrastres menores producen un tiro inválido (muy débil)

export const RESTITUTION = 0.82; // rebote en choques disco-disco / disco-bola
export const WALL_RESTITUTION = 0.75;

export const WINNING_SCORE = 5;
export const MAX_TURNS_PER_TEAM = 12; // si nadie llega a WINNING_SCORE, decide el marcador

export const TEAM_COLORS: Record<'A' | 'B', { color: string; dark: string }> = {
  A: { color: '#3A86FF', dark: '#1B4965' },
  B: { color: '#E63946', dark: '#7A1F27' },
};
