# Arquitectura y boceto

## Responsabilidades observables

| Parte | Responsabilidades |
| --- | --- |
| React | Inicio, controles, canvas, física, marcador, instrucciones y resultado. |
| Express | Crear partidas, generar formación y saque, validar tiros, contar tiros, resolver marcador y turno, conservar historial. |
| `GameClient` | Contrato para comunicar componentes y servicio de partida. |
| `RemoteGameClient` | Implementación activa con `fetch` y rutas relativas `/api/matches`. |
| `LocalGameClient` | Alternativa para pruebas manuales sin servidor; no es la usada por las E2E. |

## Flujo de un tiro

```text
Arrastre en canvas
  -> validación local de potencia
  -> POST /api/matches/:id/shots
  -> Express valida fase, disco y propietario
  -> React simula movimiento y colisiones
  -> POST /api/matches/:id/resolution
  -> Express decide marcador, siguiente turno y final
  -> React sincroniza el HUD
```

La física modifica un `useRef` en `requestAnimationFrame`. React sincroniza
su estado visible en momentos concretos, evitando actualizar todo el árbol
de componentes en cada cuadro. Express no reproduce esa física.

En producción local, Express sirve `frontend/dist` y la API en el puerto
`PORT`, o 4000 por defecto. Vite utiliza otro puerto solamente en desarrollo
y redirige `/api` a Express. No hay CORS ni Axios.

## Boceto de la implementación actual

```text
+-------------------------------------------------------+
| Equipo azul              0 - 0            Equipo rojo |
|                                       Turno de equipo |
|                                                       |
|              CANCHA, DISCOS Y BALÓN                    |
|              Arrastrar para disparar                  |
|                                                       |
| [Cómo se juega]                   Historial de eventos |
+-------------------------------------------------------+
```

Antes de la partida se superpone un formulario con los dos nombres y el
botón de inicio. Al terminar aparece el marcador, el ganador o empate y
el botón de revancha. Este boceto se elaboró a partir del código actual;
no se presenta como un diseño previo al desarrollo.
