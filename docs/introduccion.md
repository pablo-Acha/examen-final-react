# Introducción y alcance

El proyecto se llama Soccer Stars. Es un juego de fútbol con discos para dos
personas que comparten un navegador y se alternan para jugar. El usuario ve
una cancha, dos equipos de tres discos, un balón, el marcador y el turno.
Selecciona un disco propio, arrastra hacia atrás y suelta para impulsarlo.
El objetivo es empujar el balón a la portería contraria.

## Motivo de elección confirmado por el estudiante

El estudiante explicó: «Elegí el juego principalmente porque cumple con las
características que pide el documento del examen que nos mandó».

La implementación permite relacionar ese motivo con dos jugadores,
movimiento, interacción sobre un balón compartido, posiciones, turnos y
marcador. También permite elegir disco, dirección y potencia, y generar
formaciones iniciales variables. Esto describe el código existente; no
constituye una aprobación del docente ni una afirmación de originalidad.

## Experiencia propuesta

La partida combina puntería y elección de posición: un tiro puede buscar el
gol, acercar un disco al balón o cambiar la posición de los discos rivales.
React presenta el movimiento; Express acepta o rechaza los tiros y decide
el marcador, el siguiente turno y el final a partir del resultado físico
reportado por el navegador.

## Alcance actual

- Dos jugadores humanos en un mismo dispositivo; no hay multijugador remoto.
- Física propia, sin motor externo.
- Partidas guardadas en memoria del servidor; se pierden al reiniciar.
- Sin cuentas de usuario ni base de datos.
- Aplicación publicada por el estudiante en Render, con README de instalación, pruebas y despliegue.

Antes de entregar, el estudiante debe explicar qué diferencia su propuesta
de los ejercicios de clase y revisar esta documentación con el código.
