# Soccer Stars — Backend

Express + TypeScript. Guarda el estado de cada partida en memoria, decide
la formación inicial y quién saca, valida cada tiro (turno y dueño del
disco) antes de que el frontend simule la física, y calcula de forma
autoritativa el marcador, el turno siguiente y el fin de partido.

## Cómo correrlo

```bash
npm install
npm run dev      # tsx watch — recarga en caliente sobre src/index.ts
npm run build    # compila TypeScript a dist/
npm run start    # corre dist/index.js (requiere build previo)
npm run lint      # eslint sobre todo el proyecto
```

Por defecto escucha en el puerto `4000` (variable de entorno `PORT` para
cambiarlo). En producción, sirve el frontend compilado desde
`../frontend/dist` — hay que correr `npm run build` en `frontend/` antes de
`npm run start` aquí (o usar el script de la raíz del repo, que hace ambos
pasos).

## Por qué el estado vive en memoria

El alcance del examen es una única instancia del servidor corriendo
durante la partida; no hay requisito de persistir partidas entre reinicios.
Todo el almacenamiento está aislado en `src/store.ts` — si más adelante se
necesitara una base de datos, ese es el único archivo que cambiaría.

## Endpoints

Todas las rutas devuelven y reciben JSON.

### `POST /api/matches`

Crea una partida nueva.

Body:
```json
{ "teamAName": "Halcones", "teamBName": "Tigres" }
```

Respuesta `201`: el `MatchState` completo (id, formación inicial de
discos, quién saca, marcador en 0-0, etc). El servidor decide la semilla y
el equipo que saca — el cliente no puede imponerlos.

### `GET /api/matches/:id`

Devuelve el `MatchState` actual. `404` si no existe.

### `GET /api/matches/:id/history`

Devuelve sólo el historial de eventos: `{ "log": [...] }`.

### `POST /api/matches/:id/shots`

Se llama justo antes de que el frontend simule un disparo. Valida que la
partida esté en fase de apuntar y que el disco pertenezca al equipo en
turno.

Body:
```json
{ "discId": "A-0" }
```

Respuesta `200` (aceptado):
```json
{ "accepted": true, "state": { "...": "MatchState actualizado, shotsTaken incrementado, phase: \"resolving\"" } }
```

Respuesta `403` (disco de otro equipo) o `409` (fuera de fase de apuntar):
```json
{ "accepted": false, "reason": "not-your-turn", "state": { "...": "sin cambios" } }
```

### `POST /api/matches/:id/resolution`

Se llama cuando la física del frontend termina de moverse (o detecta gol).
El servidor decide marcador, turno siguiente y si el partido terminó.

Body:
```json
{ "goalTeam": "A" }
```
o
```json
{ "goalTeam": null }
```

Respuesta `200`:
```json
{
  "state": { "...": "MatchState actualizado" },
  "resetFormation": true
}
```

`resetFormation` es `true` sólo cuando hubo gol (hay formación y saque
nuevos que el frontend debe adoptar); si es `false`, el frontend conserva
las posiciones donde la física dejó los discos y el balón.

## Estructura

```
src/
  types.ts          misma forma que MatchState del frontend
  constants.ts       medidas de cancha y reglas (límite de tiros, goles para ganar)
  gameEngine.ts       formación inicial, validación de tiros, cálculo de resultado
  store.ts            almacenamiento en memoria (Map<id, MatchState>)
  matchesRouter.ts     rutas /api/matches/*
  index.ts             app de Express: JSON, rutas, estáticos del frontend
```
