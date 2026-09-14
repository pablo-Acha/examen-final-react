# Decisiones, evolución y riesgos

## Decisiones confirmadas

- El estudiante eligió el juego principalmente por cumplir las características del examen.
- Solicitó subirlo mediante GitHub CLI como «examen final react»; el nombre técnico es `examen-final-react`.
- Solicitó pruebas E2E, GitHub Actions y documentación.
- Aplazó expresamente la publicación y el README final.

## Soluciones implementadas por el asistente en esta etapa

| Solución | Motivo técnico |
| --- | --- |
| Playwright | Permite comprobar interacción real y HTTP, en headless y Chrome visible. |
| Probar el build servido por Express | Verifica frontend y API en un único origen. |
| `E2E_BASE_URL` opcional | Permite usar los mismos casos contra una futura URL pública. |
| Respuestas reales del backend | Verifica la integración; el caso de latencia demora una respuesta real, sin inventarla. |
| Workflows separados para lint y E2E | Ofrecen resultados verificables por responsabilidad. Deployment queda pendiente. |
| Bloqueo de resolución pendiente | Evita que el bucle de animación envíe el mismo resultado mientras espera HTTP. |

Estas soluciones deben ser revisadas y comprendidas por el estudiante antes de la defensa.

## Evolución comprobada

Al inicio de esta etapa existían el juego React, Express y los linters,
pero no había pruebas E2E ni workflows. `docs/` contenía un recordatorio.
La revisión detectó posibles resoluciones duplicadas en `GameCanvas`.

Se añadieron pruebas, comandos, workflows y documentación. Se corrigió el
envío duplicado con un booleano local al efecto de animación. Si falla la
resolución, aparece un mensaje y no se reenvía automáticamente, porque no
se sabe si Express procesó la primera petición. La recuperación actual
requiere recargar e iniciar otra partida.

No hay un relato confirmado de cambios anteriores ni de la autoría de cada
parte original. El estudiante debe completar ese historial con hechos reales.

## Riesgos y límites

| Riesgo | Situación o medida |
| --- | --- |
| Resoluciones duplicadas | Bloqueo y prueba con 250 ms de demora en una respuesta real. |
| Reinicio del servidor | Se pierden las partidas en memoria. |
| Manipulación de resultados | Express confía en `goalTeam`; no implementa antitrampas. |
| Fallos de red en inicio o tiro | Falta tratamiento visible completo; esta corrección cubre resolución. |
| JSON malformado y rutas API desconocidas | Faltan manejadores generales que aseguren respuestas JSON también en esos errores. |
| Coordenadas del canvas | La prueba usa la formación real y el tamaño visible, sin acceder al estado interno de React. |
| Entorno remoto | Se esperan respuestas y cambios visibles; todavía no se ha probado una URL pública. |
| Originalidad e imágenes | Revisar diferencias con ejercicios de clase y recursos gráficos antes de entregar. |
| Límite de tiros | Se exige que ambos lleguen a 12; no hay límite individual estricto tras los saques por gol. |

Se mantuvo la arquitectura de `AGENTS.md`: física propia, `useRef`, sincronización
puntual y decisiones relevantes de Express. No se añadieron librerías de
interfaz, estado, routing ni motores de juego.
