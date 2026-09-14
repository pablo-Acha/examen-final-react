# Soccer Stars — Frontend

Duelo de discos por turnos (estilo "Soccer Stars"): dos equipos, un balón,
toda la física de choques y fricción programada a mano en TypeScript. Este
paquete es sólo el frontend — ver `../backend` y el README de la raíz del
repositorio para levantar el proyecto completo (frontend + Express en el
mismo puerto).

## Cómo correrlo

```bash
npm install
npm run dev      # servidor de desarrollo con recarga en caliente
npm run build    # type-check (tsc) + build de producción a dist/
npm run lint      # oxlint sobre todo el proyecto
```

`npm run dev` sólo levanta el frontend. Para que las llamadas a
`/api/matches/...` respondan, el backend debe estar corriendo aparte (ver
`../backend`) — Vite redirige `/api` hacia `http://localhost:4000` (ver
`vite.config.ts`). La forma más simple de correr todo junto está en el
README de la raíz del repositorio.

## Cómo se juega

- Arrastra desde uno de tus discos (color de tu equipo) hacia atrás para
  apuntar; suelta para disparar en la dirección contraria al arrastre
  (como una resortera).
- Solo puedes seleccionar discos de tu propio equipo, y solo en tu turno.
- El balón rebota en las paredes y entra por la boca del arco para anotar.
- Gana quien llegue primero a 5 goles, o quien vaya ganando cuando ambos
  equipos agoten sus tiros (12 por equipo). Empate si el marcador queda
  igualado en ese límite.

## Arquitectura

```
src/
  game/
    types.ts       tipos del estado de la partida (discos, balón, turno, etc.)
    constants.ts    medidas de cancha, fricción, velocidades de tiro
    physics.ts      vectores, integración, colisiones, detección de gol
    engine.ts       reglas: formación inicial, turnos, marcador, fin de partido
  services/
    gameClient.ts   contrato de API (ver "Próximo paso" abajo)
  components/
    GameCanvas.tsx      dibuja la cancha en <canvas> y maneja el arrastre/disparo
    Scoreboard.tsx      marcador y turno actual
    EventLog.tsx        feed de eventos (goles, turnos, acciones inválidas)
    StartScreen.tsx     pantalla de inicio (nombres de equipo)
    ResultOverlay.tsx   pantalla de resultado final
    InstructionsPanel.tsx  panel de reglas plegable
  App.tsx           conecta todo alrededor del estado mutable de la partida
```

**Por qué un ref mutable en vez de useState para la física:** la simulación
corre a ~60 cuadros por segundo dentro de `GameCanvas`, leyendo y mutando
directamente `MatchState` a través de un `useRef`. Si cada cuadro pasara por
`setState` de React, se forzaría un re-render completo del árbol de
componentes 60 veces por segundo. En cambio, el HUD (marcador, turno,
registro de eventos) sólo se sincroniza con React en los momentos que
importan a la interfaz: cuando se dispara, cuando algo se detiene, cuando
hay gol, o cuando termina el partido.

## Cómo se conecta con Express

`src/services/gameClient.ts` define el contrato `GameClient` y dos
implementaciones:

- **`RemoteGameClient`** (la que se usa por defecto): habla con el backend
  real por `fetch` contra `/api/matches/...`. Es la que exige el examen —
  ver `../backend/README.md` para el detalle de cada endpoint.
- **`LocalGameClient`**: corre las mismas reglas sin red, como respaldo
  para probar la interfaz sin levantar el backend. No se usa por defecto.

Flujo real de un tiro: al seleccionar un disco se valida localmente (para
que apuntar se sienta instantáneo); al soltar y disparar, el frontend
evalúa si el arrastre alcanza (si no, cancela sin red), y si es un tiro de
verdad, llama a `POST /api/matches/:id/shots` — el servidor confirma que el
disco es del equipo en turno antes de que el frontend aplique cualquier
velocidad. Cuando la física local termina de moverse (o hay gol), el
frontend reporta el resultado a `POST /api/matches/:id/resolution`, y el
servidor decide de forma autoritativa marcador, turno y fin de partido.
