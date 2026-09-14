# API HTTP y JSON

Base: `/api/matches`, en el mismo origen que el frontend. Para enviar un
cuerpo se usa `Content-Type: application/json`. No hay autenticación:
el identificador de partida permite consultar y modificar esa partida.

| Método y ruta | Entrada | Salida correcta | Errores previstos |
| --- | --- | --- | --- |
| POST `/api/matches` | Nombres opcionales | 201, estado completo | 400, nombre no textual |
| GET `/api/matches/:id` | ID en ruta | 200, estado completo | 404 |
| GET `/api/matches/:id/history` | ID en ruta | 200, `{ "log": [...] }` | 404 |
| POST `/api/matches/:id/shots` | `discId` | 200, aceptación y estado | 400, 403, 404, 409 |
| POST `/api/matches/:id/resolution` | `goalTeam`: `"A"`, `"B"` o `null` | 200, estado y `resetFormation` | 400, 404, 409 |

## Crear y consultar

Solicitud `POST /api/matches`:

```json
{ "teamAName": "Halcones", "teamBName": "Tigres" }
```

La respuesta contiene `id`, `phase`, `teams`, `discs`, `ball`, `turn`,
`score`, `shotsTaken`, `config`, `selectedDiscId`, `log`, `winner`, `seed`,
`createdAt` y `updatedAt`. El ID y la semilla se generan en el servidor.
El esquema exacto está en `backend/src/types.ts`, interfaz `MatchState`.

Ejemplo abreviado de respuesta; se muestran algunos campos, no el cuerpo completo:

```json
{
  "id": "id-generado-por-el-servidor",
  "phase": "aiming",
  "turn": "A",
  "score": { "A": 0, "B": 0 },
  "shotsTaken": { "A": 0, "B": 0 },
  "winner": null
}
```

Con ese ID, `GET /api/matches/:id` devuelve el estado guardado y
`GET /api/matches/:id/history` devuelve su historial. Si no existe:

```json
{ "error": "Partida no encontrada" }
```

## Validar un tiro

Solicitud a `POST /api/matches/:id/shots`:

```json
{ "discId": "A-0" }
```

Si juega A y la fase es `aiming`, la respuesta incluye `accepted: true`
y `state` completo, pasa a `resolving` e incrementa los tiros de A.
Si corresponde jugar a B, devuelve 403 con `accepted: false`,
`reason: "not-your-turn"` y `state` completo. No consume el turno.

Otros motivos: `unknown-disc` (400), `not-aiming-phase` (409) y
`match-finished` (409). Si falta `discId`, responde 400:

```json
{ "error": "discId es requerido" }
```

## Resolver un tiro

Solicitud a `POST /api/matches/:id/resolution` sin gol:

```json
{ "goalTeam": null }
```

Con gol de A:

```json
{ "goalTeam": "A" }
```

La respuesta incluye `state` completo y `resetFormation`: `true` cuando
debe reemplazarse la formación tras un gol que no finalizó la partida;
`false` cuando deben conservarse las posiciones del navegador.
No puede resolverse un tiro si no está en fase `resolving` (409):

```json
{ "error": "No hay un tiro en curso para resolver" }
```

## Límites actuales

El servidor confía en el resultado físico reportado por el navegador;
no comprueba mediante simulación si el balón realmente entró. Tampoco
recibe las posiciones finales, por lo que GET no sirve para reconstruir
la ubicación actual de todos los cuerpos tras cada tiro.

Los errores previstos de las rutas se devuelven como JSON. Aún no hay un
manejador JSON propio para cuerpos JSON malformados ni para rutas API
desconocidas; Express puede responder HTML en esos casos.
