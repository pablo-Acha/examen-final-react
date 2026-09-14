# Reglas, estados e interacción

## Inicio y acciones

1. Escribir los nombres de los equipos o dejar los nombres predeterminados.
2. Pulsar «Iniciar partido». Express crea la partida con marcador 0-0,
   tres discos por equipo, una formación variable y un equipo de saque.
3. En el turno propio, arrastrar desde un disco hacia atrás y soltar.
   La dirección del impulso es opuesta al arrastre y su potencia tiene límite.
4. Esperar a que termine el movimiento. Express decide el turno siguiente.

No se puede seleccionar un disco rival ni jugar mientras se resuelve el
tiro. Un arrastre menor de 12 unidades se cancela; entre 12 y menos de 20
se rechaza por débil. Esas acciones no consumen tiro. Express también
rechaza discos inexistentes, turnos incorrectos y tiros tras finalizar.

## Goles y final

El equipo A ataca la portería derecha y B la izquierda. Cuando el navegador
detecta un gol, lo comunica a Express. El servidor aumenta el marcador y,
si continúa la partida, prepara otra formación y da el saque al equipo
que recibió el gol. Sin gol, el turno cambia al otro equipo.

Gana quien llegue a cinco goles. Si ambos equipos han utilizado al menos
12 tiros, gana el mayor marcador; con igualdad, hay empate. La pantalla
de resultado permite crear una revancha con los mismos nombres.

La implementación comprueba el límite cuando **ambos** equipos lo alcanzan.
No impone un máximo individual estricto antes de cada tiro: los saques tras
un gol pueden desequilibrar los tiros utilizados. Este comportamiento debe
tenerse en cuenta al explicar la regla; no se ha cambiado en esta etapa.

## Estados relacionados

| Estado | Uso |
| --- | --- |
| Posición y velocidad | Discos y balón se desplazan y colisionan. |
| Turno y disco seleccionado | Determinan quién puede disparar. |
| Marcador y tiros utilizados | Determinan el resultado del partido. |
| Fase | Inicio, puntería, arrastre, resolución, pausa de gol y final en la UI. |
| Historial | Presenta cambios importantes y acciones inválidas. |

Express conserva las fases `aiming`, `resolving` y `finished`; las fases
adicionales son de presentación. Las posiciones en Express corresponden a
la formación: no se actualizan con cada movimiento físico del navegador.

## Variabilidad y estrategia

La semilla basada en la hora modifica ligeramente la formación y el saque.
Hay un conjunto limitado de variaciones; no se garantiza que cada partida
tenga una formación única. El jugador elige entre tres discos y controla
dirección y fuerza, afectando las posiciones compartidas.
