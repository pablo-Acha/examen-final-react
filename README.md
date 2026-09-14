# Soccer Stars

Juego web de fútbol con discos para dos personas en el mismo dispositivo.
Proyecto de certificación con React, Express y TypeScript: el navegador
simula el movimiento y el servidor valida los tiros y decide el resultado.

**[Jugar en Render](https://examen-final-react.onrender.com/)** ·
**[Repositorio](https://github.com/pablo-Acha/examen-final-react)** ·
**[GitHub Actions](https://github.com/pablo-Acha/examen-final-react/actions)**

## Cómo jugar

1. Escribir los nombres de los equipos y pulsar **Iniciar partido**.
2. En el turno propio, elegir uno de los tres discos del equipo.
3. Arrastrar hacia atrás y soltar: el disco sale en dirección opuesta al arrastre.
4. Empujar el balón a la portería contraria. A ataca a la derecha y B a la izquierda.
5. Esperar a que termine el movimiento para continuar.

Gana quien llegue a cinco goles. Cuando ambos equipos han utilizado al menos
12 tiros, gana el mayor marcador; si están iguales, hay empate. Tras un gol
saca el equipo que lo recibió. La formación inicial y el primer saque varían.
Los discos rivales, los tiros débiles y las acciones fuera de fase se rechazan.
La pantalla incluye marcador, turno, instrucciones, historial y resultado con revancha.

## Requisitos

- Node.js **22.12 o posterior de la rama 22** y npm. Verificado localmente con Node.js 22.20.0.
- Git y acceso al repositorio; si es privado, la cuenta debe tener permiso.
- Google Chrome instalado para las pruebas visuales de la defensa.
- Conexión a Internet para instalar dependencias y probar la aplicación publicada.

No se necesita Docker ni una base de datos. Las únicas dependencias de
ejecución de la aplicación son React, React DOM y Express. Playwright se
utiliza para pruebas; TypeScript, Vite y los linters son herramientas de desarrollo.

## Instalación y ejecución local

```bash
git clone https://github.com/pablo-Acha/examen-final-react.git
cd examen-final-react
npm ci
npm ci --prefix frontend
npm ci --prefix backend
npm run build
npm start
```

Abrir [http://localhost:4000](http://localhost:4000). Express sirve el frontend
compilado y la API desde el mismo puerto. Detener el servidor con `Ctrl+C`.
Los comandos `npm ci` usan las versiones de los archivos de bloqueo.

### Desarrollo con recarga automática

En una terminal:

```bash
npm run dev:backend
```

En otra:

```bash
npm run dev:frontend
```

Abrir [http://localhost:5173](http://localhost:5173). El proxy de Vite envía
`/api` a Express en 4000. Los dos puertos se usan solo durante desarrollo.

### Comandos disponibles

| Comando desde la raíz | Función |
| --- | --- |
| `npm run install:all` | Instalar dependencias de raíz, frontend y backend con npm install. |
| `npm run build` | Comprobar tipos y compilar ambos paquetes. |
| `npm start` | Iniciar Express y servir el build de React. |
| `npm run dev:backend` | Express con recarga automática. |
| `npm run dev:frontend` | Servidor de desarrollo Vite. |
| `npm run lint` | Ejecutar Oxlint en frontend y ESLint en backend. |
| `npm run test:e2e` | Pruebas en Chromium headless. |
| `npm run test:e2e:chrome` | Pruebas en Google Chrome visible. |
| `npm run test:e2e:report` | Abrir el informe HTML de Playwright. |

## Arquitectura

```text
frontend/           React, TypeScript, canvas, física y cliente fetch
backend/            Express, TypeScript, reglas y almacenamiento en memoria
tests/e2e/          Pruebas de navegador y API con Playwright
.github/workflows/  Lint, E2E y despliegue en Render
scripts/            Solicitud y comprobación del despliegue
docs/               Reglas, API, decisiones, investigación y uso de IA
```

- **React** recibe los eventos y dibuja el juego. La física propia modifica
  un `useRef` dentro de `requestAnimationFrame`; el estado visible se sincroniza
  en momentos concretos, sin renderizar todo React en cada cuadro.
- **Express** crea la formación y el saque, valida fase y propietario del disco,
  cuenta tiros y decide marcador, turno y fin a partir del resultado físico reportado.
- **`GameClient`** define el contrato de comunicación. La aplicación utiliza
  `RemoteGameClient`, con `fetch` nativo. `LocalGameClient` es una alternativa
  de demostración y no se utiliza en las E2E.
- **`store.ts`** conserva las partidas en un `Map` en memoria, por ID.

```text
Arrastre → POST /shots → validación de Express → física en React
         → POST /resolution → marcador y turno del servidor → actualización visual
```

La resolución se envía una sola vez mientras se espera la respuesta HTTP.
El servidor no simula física ni recibe posiciones en cada cuadro.

## API HTTP y JSON

Las solicitudes con cuerpo usan `Content-Type: application/json`.
Las rutas de partida están bajo `/api/matches` en el mismo origen que React.

| Método | Ruta | Entrada | Respuesta correcta |
| --- | --- | --- | --- |
| GET | `/api/health` | Sin cuerpo | 200: `status` y SHA publicado, o `null` en local. |
| POST | `/api/matches` | `teamAName`, `teamBName`, opcionales | 201: estado completo de la partida. |
| GET | `/api/matches/:id` | ID en ruta | 200: estado guardado. |
| GET | `/api/matches/:id/history` | ID en ruta | 200: objeto con `log`. |
| POST | `/api/matches/:id/shots` | `discId` | 200: `accepted` y `state`. |
| POST | `/api/matches/:id/resolution` | `goalTeam`: `"A"`, `"B"` o `null` | 200: `state` y `resetFormation`. |

Ejemplo de creación (`POST /api/matches`):

```json
{ "teamAName": "Halcones", "teamBName": "Tigres" }
```

La respuesta contiene ID, equipos, discos, balón, turno, marcador, tiros,
configuración, fase e historial. Con su ID se puede consultar la partida.
Ejemplo completo de error al consultar un ID inexistente (404):

```json
{ "error": "Partida no encontrada" }
```

Para demostrar una solicitud real en PowerShell con el servidor local iniciado:

```powershell
$partida = Invoke-RestMethod -Method Post -Uri 'http://localhost:4000/api/matches' -ContentType 'application/json' -Body '{"teamAName":"Halcones","teamBName":"Tigres"}'
$partida | ConvertTo-Json -Depth 10
Invoke-RestMethod -Uri "http://localhost:4000/api/matches/$($partida.id)" | ConvertTo-Json -Depth 10
```

Los errores previstos incluyen 400 para entradas inválidas, 403 para disco
rival, 404 para partida inexistente y 409 para fase incorrecta o partida
terminada. Ver [API detallada](docs/api.md) y [tipos del estado](backend/src/types.ts).

## Pruebas E2E

Preparar Chromium una vez y compilar antes de probar cambios:

```bash
npx playwright install chromium
npm run build
npm run lint
npm run test:e2e
```

Playwright inicia y detiene Express automáticamente cuando no se define
`E2E_BASE_URL`. Dejar libre el puerto 4000: no reutiliza servidores existentes.
Las pruebas locales usan el build, por lo que requieren recompilar tras cambiar código.

Para ejecutar las mismas pruebas en Chrome visible localmente:

```bash
npm run test:e2e:chrome
```

### Pruebas visuales contra producción

Abrir primero la aplicación y esperar a que responda. En PowerShell:

```powershell
$env:E2E_BASE_URL = 'https://examen-final-react.onrender.com'
npm run test:e2e:chrome
Remove-Item Env:E2E_BASE_URL
```

En bash:

```bash
E2E_BASE_URL=https://examen-final-react.onrender.com npm run test:e2e:chrome
```

Al especificar la URL, Playwright no inicia Express local. Crea partidas
reales en el servidor publicado y comprueba:

1. Inicio, nombres, instrucciones y consultas HTTP del estado.
2. Rechazo de un disco rival en pantalla y en Express, sin consumir turno.
3. Arrastre real, aceptación del tiro, resolución única con latencia y cambio de turno.
4. Finalización por límite de tiros y rechazo de otro tiro, mediante una prueba complementaria de API.

El cuarto caso comprueba la finalización del backend, no la pantalla de
resultado. El informe HTML se abre con `npm run test:e2e:report`; los fallos
conservan trazas, capturas y video. No se utilizan respuestas de juego inventadas.

## Despliegue en Render

El servicio actual es [examen-final-react.onrender.com](https://examen-final-react.onrender.com/).
Para reproducir la configuración:

| Campo | Valor |
| --- | --- |
| Tipo y entorno | Web Service, Node.js |
| Repositorio y rama | `pablo-Acha/examen-final-react`, `main` |
| Root Directory | Vacío |
| Build Command | `npm ci --prefix frontend && npm ci --prefix backend && npm run build` |
| Start Command | `npm start` |
| Plan utilizado | Free |
| Auto-Deploy | Desactivado: publica GitHub Actions después de validar. |

En Render, copiar el **Deploy Hook** del servicio y guardarlo como secreto
de Actions llamado `RENDER_DEPLOY_HOOK_URL` en GitHub. No incluir el valor
en código, documentación ni videos. Estos ajustes ya fueron realizados para el servicio actual.

### Variables de entorno y secretos

| Nombre | Dónde se usa | Valor o función |
| --- | --- | --- |
| `PORT` | Express | Render lo proporciona; 4000 por defecto en local. |
| `RENDER_GIT_COMMIT` | Express en Render | SHA proporcionado por Render; `/api/health` lo devuelve para comprobar la versión. |
| `E2E_BASE_URL` | Playwright y despliegue | URL de destino. Sin definir, las pruebas usan `http://127.0.0.1:4000`. |
| `RENDER_DEPLOY_HOOK_URL` | Secreto de GitHub Actions | Autoriza el despliegue del servicio. No se necesita para jugar localmente. |
| `GITHUB_SHA` | GitHub Actions | Commit que debe desplegarse; lo proporciona GitHub. |
| `CI` | Playwright en Actions | Prohíbe pruebas marcadas con `test.only`; lo proporciona GitHub. |

No se requiere un archivo `.env` para la ejecución local predeterminada.

### Integración y entrega continua

Cada push a `main` activa [deploy.yml](.github/workflows/deploy.yml):

1. Llama a [lint.yml](.github/workflows/lint.yml) y [e2e.yml](.github/workflows/e2e.yml).
2. Si ambos pasan, solicita a Render desplegar ese mismo SHA.
3. Espera hasta ocho minutos a que `/api/health` identifique la revisión esperada.
4. Ejecuta las E2E contra producción y guarda el informe como artefacto.

Los workflows de lint y E2E también funcionan en pull requests y manualmente.
El despliegue manual debe ejecutarse desde `main`. Hay tres responsabilidades
diferenciadas: lint, pruebas y deployment. Si el despliegue o las pruebas fallan,
Actions lo informa; no existe rollback automático.

**Evidencia:** [ejecución completa exitosa](https://github.com/pablo-Acha/examen-final-react/actions/runs/34902389245),
con lint, E2E, publicación del SHA y pruebas en producción. También se verificaron
build, lint y las cuatro pruebas tanto en Chromium headless como en Chrome visible.

## Documentación y límites conocidos

- [Introducción y elección del juego](docs/introduccion.md)
- [Reglas y estados](docs/reglas.md)
- [Arquitectura y boceto](docs/arquitectura.md)
- [Decisiones, evolución y riesgos](docs/decisiones.md)
- [Investigación y pruebas](docs/investigacion.md)
- [Publicación y defensa](docs/publicacion.md)
- [Registro de uso de IA](docs/uso-ia.md)

Las partidas se pierden al reiniciar o desplegar el servidor. El plan gratuito
de Render puede suspender el servicio tras inactividad; abrir la URL antes de
la demostración y esperar su respuesta. No hay cuentas ni multijugador remoto.
Express confía en el resultado físico reportado por el navegador y sus posiciones
guardadas corresponden a la formación, no a cada movimiento posterior.

Quedan mejoras conocidas: manejo completo de errores de red, respuestas JSON
generales para cuerpos malformados y rutas API desconocidas, y revisión de los
recursos gráficos exigidos por el examen. El límite de tiros se comprueba cuando
ambos equipos llegan a 12, sin un bloqueo individual estricto después de los goles.

La preparación de la entrega también requiere el video de 3 a 5 minutos,
acceso del docente al repositorio, revisión personal del código y documentación,
comprobación de originalidad respecto de clase y ensayo de la defensa de 10 minutos.
El registro distingue verificaciones del asistente y del estudiante.
