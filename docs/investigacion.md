# Investigación técnica y pruebas

## Fuentes consultadas por el asistente

- [Playwright: integración continua](https://playwright.dev/docs/ci): instalación del navegador y dependencias en Actions.
- [Playwright: configuración](https://playwright.dev/docs/api/class-testconfig): servidor, proyectos, reporter y URL base.
- [Playwright: navegadores](https://playwright.dev/docs/browsers): Chromium incluido y canal Google Chrome.
- [Playwright: pruebas de API](https://playwright.dev/docs/api-testing): consultas al backend desde las pruebas.
- [GitHub: sintaxis de workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax): eventos, jobs y permisos.

Estas fuentes fueron consultadas por el asistente. El estudiante debe
revisarlas y registrar qué comprendió o comprobó personalmente.

## Preparación local

Requisitos: Node.js 22.12 o superior compatible con Vite, npm y Google
Chrome instalado para la ejecución visual. Desde la raíz:

```bash
npm ci
npm ci --prefix frontend
npm ci --prefix backend
npx playwright install chromium
npm run build
npm run lint
npm run test:e2e
```

La prueba arranca Express en 4000 y sirve el frontend compilado. Dejar ese
puerto libre. Playwright cierra el servidor que inició y no reutiliza otro
existente, para evitar probar accidentalmente una versión diferente.
Ejecutar nuevamente el build si se modifica la aplicación.

Para Chrome visible y para abrir el informe HTML, respectivamente:

```bash
npm run test:e2e:chrome
npm run test:e2e:report
```

## Cobertura

| Caso | Evidencia |
| --- | --- |
| Inicio e instrucciones | Nombres, POST 201 JSON, GET del estado, equipos, turno y ayuda visibles. |
| Disco rival | Clic rechazado en UI y POST rechazado por Express con 403 sin consumir turno. |
| Tiro con latencia | Arrastre real, aceptación, resolución única, cambio de turno y ausencia de errores JavaScript. |
| Final por límite de tiros | Caso complementario de API: empate tras agotar tiros y rechazo de otro tiro con 409. |

El último caso comprueba finalización del backend, no la pantalla de
resultado. El caso de validación requerido también se cubre en navegador.
No se afirma haber probado todas las colisiones, goles o resoluciones de pantalla.

## GitHub Actions

`lint.yml` valida frontend y backend. `e2e.yml` instala dependencias,
compila ambos paquetes, instala Chromium en Linux y ejecuta las E2E
headless. Guarda el reporte durante siete días; trazas, capturas y videos
se conservan en caso de fallo. Ambos workflows responden a push a `main`,
pull request y ejecución manual, con permisos de lectura y límite de tiempo.

No se creó un workflow que simule un deployment. Esa tercera responsabilidad
del examen permanece pendiente junto con la publicación solicitada para después.

## Ejecución futura contra una URL pública

En PowerShell, reemplazar el ejemplo por la URL real cuando exista:

```powershell
$env:E2E_BASE_URL = 'https://URL-REAL-DEL-JUEGO'
npm run test:e2e:chrome
Remove-Item Env:E2E_BASE_URL
```

En bash:

```bash
E2E_BASE_URL=https://URL-REAL-DEL-JUEGO npm run test:e2e:chrome
```

La variable evita iniciar Express local. Las pruebas crean partidas reales
en ese servidor, con nombres de prueba. No hay endpoint para borrarlas;
permanecen en memoria hasta reiniciar el servidor.

## Publicación aplazada

No se eligió ni configuró proveedor. Express ya utiliza `PORT`, con 4000
por defecto, y un único origen. Faltan investigación del servicio, configuración,
workflow de despliegue, URL y pruebas en producción. Docker es opcional y
no se incorporó.

## Verificaciones de esta etapa

Ejecuciones realizadas por el asistente en Windows con Node.js 22.20.0:

| Comando | Resultado |
| --- | --- |
| `npm run build` | Frontend y backend compilados, salida 0. |
| `npm run lint` | Ambos linters sin errores, salida 0. |
| `npm run test:e2e` | Cuatro pruebas aprobadas en Chromium headless. |
| `npm run test:e2e:chrome` | Cuatro pruebas aprobadas en Google Chrome visible. |

Las pruebas locales usan el build servido por Express en 4000. Las
ejecuciones remotas se consultan en la pestaña Actions del repositorio;
su resultado debe verificarse después de subir los workflows. No se han
ejecutado pruebas contra una aplicación publicada, porque la publicación
está aplazada. Estas verificaciones no sustituyen el ensayo del estudiante.
