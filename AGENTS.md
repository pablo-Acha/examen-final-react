# AGENTS.md

Instrucciones para cualquier agente de IA (Claude Code, Cursor, Copilot,
etc.) que trabaje en este repositorio. Léelas antes de tocar código.

## Qué es este proyecto

Juego web de dos jugadores estilo "Soccer Stars" para un examen de
certificación. Frontend en React + TypeScript, backend en Express +
TypeScript, comunicados por HTTP/JSON bajo el mismo dominio y puerto. El
requisito central del examen es que el estudiante pueda explicar, probar y
modificar cada línea de código presentado — cualquier cambio que un agente
haga debe quedar dentro de algo que el estudiante realmente entienda.

## Estructura

```
frontend/    React + TypeScript (Vite). Ver frontend/README.md.
backend/     Express + TypeScript. Ver backend/README.md.
docs/        Documentación de decisiones del proyecto (la escribe el estudiante).
```

## Comandos

Desde la raíz:

```bash
npm run install:all     # instala frontend y backend
npm run build            # build de producción de ambos
npm start                 # Express en :4000 sirviendo el frontend compilado
npm run dev:backend       # Express con recarga en caliente, :4000
npm run dev:frontend      # Vite con recarga en caliente, :5173 (proxy /api -> :4000)
npm run lint               # linter de frontend y backend
```

Dentro de `frontend/` o `backend/` por separado: `npm run dev`, `npm run
build`, `npm run lint`. El frontend además corre `tsc -b` como parte de
`build` (falla el build si hay errores de tipos). El backend usa `tsx
watch` en dev y compila con `tsc` a `dist/` para producción.

**Antes de dar por terminado cualquier cambio**, correr `npm run build` y
`npm run lint` en el paquete que se tocó (o ambos, desde la raíz) y
confirmar que terminan sin errores.

## Restricciones técnicas del examen (no negociables)

Estas reglas vienen del enunciado del examen, no son preferencia de estilo.
Un agente **no debe** violarlas aunque parezcan atajos razonables:

- **No agregar librerías externas** para lógica principal, estado, routing
  o interfaz. Prohibido explícitamente: Bootstrap, Tailwind, Axios, React
  Router, Redux, motores de juego (Matter.js, Phaser, etc.), bibliotecas de
  componentes. Permitido: React, Express, TypeScript, herramientas mínimas
  de construcción (Vite, tsx/tsc) y una herramienta de pruebas E2E
  (Playwright/Cypress).
- **fetch nativo, no Axios.** La comunicación React → Express ya usa
  `fetch` en `frontend/src/services/gameClient.ts` (`RemoteGameClient`).
- **JSON en toda la API.** Cualquier endpoint nuevo debe recibir y devolver
  JSON.
- **Mismo dominio y puerto.** No introducir CORS ni un segundo puerto en
  producción — Express sirve `frontend/dist` (ver `backend/src/index.ts`).
  El proxy de Vite (`frontend/vite.config.ts`) es sólo para desarrollo.
- **El backend debe seguir participando en decisiones reales** de la
  partida (ver `backend/src/gameEngine.ts`): formación inicial y saque,
  validación de turno/dueño del disco, y cálculo autoritativo de
  marcador/turno/fin de partido. No mover esa lógica al frontend "para
  simplificar".
- **Sin motor de física externo.** Toda la simulación
  (`frontend/src/game/physics.ts`) está escrita a mano. No reemplazar por
  Matter.js ni similar.

## Arquitectura a respetar

- La física corre en el navegador a ~60fps sobre un `useRef` mutable
  (`frontend/src/App.tsx`, `GameCanvas.tsx`), no por `setState` en cada
  cuadro — eso re-renderizaría todo el árbol de React 60 veces por
  segundo. El HUD sólo se sincroniza (`onSync`) en momentos discretos:
  disparo confirmado, fin de movimiento, gol, fin de partido.
- El backend **no simula física**. Sólo valida y decide en los momentos de
  frontera: crear partida, aceptar/rechazar un tiro, resolver el resultado
  de un tiro ya simulado.
- El estado de cada partida vive en memoria en el backend
  (`backend/src/store.ts`), indexado por `id`. No hay base de datos —si se
  necesitara persistencia real, ese es el único archivo a cambiar.
- `frontend/src/services/gameClient.ts` expone la interfaz `GameClient`
  con dos implementaciones: `RemoteGameClient` (la real, usa fetch) y
  `LocalGameClient` (respaldo sin red, sólo para probar la UI). El resto
  de los componentes de React sólo conoce la interfaz, nunca una
  implementación concreta directamente.

## Convenciones de código

- TypeScript estricto en ambos paquetes (`strict: true`); no usar `any`
  para evadir errores de tipos.
- Comentarios y mensajes de log/UI en español, consistente con el resto
  del repo.
- Nombres de archivos y funciones en inglés (`gameEngine.ts`,
  `resolveOutcome`), texto visible al usuario y comentarios explicativos en
  español — así está el resto del código, mantener el patrón.
- No introducir un segundo patrón de manejo de estado (contexto global,
  librería de estado) donde ya existe el `useRef` + sync puntual descrito
  arriba.

## Qué no generar

- No inventar contenido para `docs/*.md` en nombre del estudiante: esa
  documentación debe reflejar decisiones que el estudiante realmente tomó
  y pueda defender oralmente. Un agente puede ayudar a *redactar* una vez
  que el estudiante explica su decisión, pero no debe inventar
  justificaciones técnicas no discutidas.
- No generar código que el estudiante no pueda explicar en la defensa
  (10 minutos, individual, con cambio en vivo pedido por el docente). Preferir
  soluciones simples y legibles sobre abstracciones cleverness.
