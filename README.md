# Soccer Stars

Proyecto de certificación: juego web de dos jugadores, frontend en React +
TypeScript y backend en Express + TypeScript, comunicados por HTTP/JSON
bajo el mismo dominio y puerto.

## Arranque rápido (todo junto, como en producción)

```bash
npm run install:all
npm run build          # compila frontend y backend
npm start              # levanta Express en :4000, sirviendo el frontend compilado
```

Abrir `http://localhost:4000`.

## Arranque en desarrollo (con recarga en caliente)

En dos terminales:

```bash
npm run dev:backend     # Express en :4000
npm run dev:frontend    # Vite en :5173, con proxy de /api hacia :4000
```

Abrir `http://localhost:5173`.

## Estructura del repositorio

```
frontend/    React + TypeScript. Ver frontend/README.md.
backend/     Express + TypeScript. Ver backend/README.md.
docs/        Documentación de decisiones del proyecto (por completar).
```

## Arquitectura, en una imagen mental

- **React** dibuja la cancha en `<canvas>`, recibe el arrastre del mouse/dedo
  para apuntar y simula la física (fricción, rebotes, colisiones) a 60
  cuadros por segundo — eso es demasiado rápido para ir por red en cada
  cuadro, así que corre en el navegador.
- **Express** no simula física. Participa donde sí importa que sea
  autoritativo: decide la formación inicial y quién saca al crear la
  partida, valida que cada tiro sea de un disco del equipo en turno antes
  de que el frontend lo simule, y calcula marcador/turno/fin de partido
  cuando el frontend reporta si hubo gol.
- El estado de cada partida vive en memoria en el backend, identificado por
  un id que el frontend guarda tras crear la partida.

Ver `frontend/README.md` y `backend/README.md` para el detalle de cada
pieza y de los endpoints.

## Qué falta para cumplir el examen completo

Este repositorio ya tiene el frontend jugable y el backend integrado por
fetch real. Todavía falta (para la entrega, no para que el juego funcione):

- [ ] Documentación en `docs/` (introducción, reglas, diseño de API, boceto,
      decisiones técnicas, riesgos, investigación de E2E/publicación,
      registro de uso de IA).
- [ ] Pruebas E2E con Playwright/Cypress.
- [ ] Al menos tres GitHub Actions: linters, E2E, deployment.
- [ ] Publicar la aplicación completa en un servicio con URL pública
      (Render u otro).
- [ ] `README.md` final con variables de entorno y enlace al despliegue.

Estos son los próximos pasos naturales de la conversación.
