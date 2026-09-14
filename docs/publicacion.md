# Publicación en Render y GitHub Actions

Aplicación: https://examen-final-react.onrender.com/

El estudiante creó el servicio en Render y confirmó que era accesible.
El asistente ejecutó las cuatro pruebas contra esa URL en Chrome visible:
todas pasaron. Posteriormente el estudiante solicitó automatizar el despliegue.

## Configuración del servicio

- Web Service Node, repositorio `pablo-Acha/examen-final-react`, rama `main`.
- Directorio raíz vacío: se construye desde la raíz del repositorio.
- Build: `npm ci --prefix frontend && npm ci --prefix backend && npm run build`.
- Inicio: `npm start`.
- Express sirve React compilado y API bajo el mismo dominio y puerto.
- `PORT` lo proporciona Render; localmente se usa 4000 por defecto.
- `RENDER_GIT_COMMIT` lo proporciona Render para identificar la revisión publicada.
- No se utiliza Docker ni base de datos.

Estos son los valores esperados por el workflow; los ajustes de la cuenta
se gestionan en el panel de Render. El plan gratuito puede suspender el
servicio tras 15 minutos de inactividad y requiere tiempo para despertar.
Las partidas en memoria se pierden al reiniciar o desplegar. Antes de la
defensa, abrir la URL y esperar a que responda.

## Conexión inicial

1. Render → servicio → Settings → Deploy Hook: copiar el enlace secreto.
2. GitHub → repositorio → Settings → Secrets and variables → Actions:
   crear el secreto `RENDER_DEPLOY_HOOK_URL` con ese enlace.
3. En Render, desactivar Auto-Deploy para que la publicación dependa de
   las validaciones de GitHub Actions y no se dispare también por cada push.

El enlace permite iniciar despliegues: no guardarlo en el repositorio ni
mostrarlo en el video. No es necesario crear una API key de toda la cuenta.

El estudiante confirmó que completó ambos ajustes: secreto en GitHub y
Auto-Deploy desactivado. El asistente verificó la existencia del nombre del
secreto mediante GitHub CLI, sin consultar ni mostrar su valor.

## Flujo automatizado

`deploy.yml` se activa por push a `main` o ejecución manual. Llama a los
workflows reutilizables `lint.yml` y `e2e.yml`. Solo si ambos pasan, comienza
el job `deploy`. Los workflows de lint y E2E también funcionan en pull requests
y manualmente. Son tres responsabilidades diferenciadas en Actions.

El script `scripts/deploy-render.mjs` añade `ref=GITHUB_SHA` al hook para
publicar el commit que pasó los controles. Un HTTP 200/202 del hook solo
indica que Render aceptó la solicitud. Por eso el script espera hasta ocho
minutos a que `GET /api/health` responda `status: "ok"` y el mismo SHA.
El endpoint devuelve `commit: null` en local, sin exponer variables secretas.

Después, Playwright ejecuta las cuatro pruebas en la URL pública en modo
headless. El resultado y el informe `reporte-playwright-produccion` quedan
en Actions. El proceso falla si no aparece la revisión esperada o si fallan
las pruebas. No hay rollback automático: revisar los logs de Render y corregir
o volver a desplegar una revisión conocida si es necesario.

El grupo de concurrencia evita que dos workflows de publicación actúen al
mismo tiempo. No cancelar un despliegue en curso para iniciar otro durante
la demostración. Una ejecución manual debe seleccionarse desde `main`.

## Comandos para la defensa

```powershell
$env:E2E_BASE_URL = 'https://examen-final-react.onrender.com'
npm run test:e2e:chrome
Remove-Item Env:E2E_BASE_URL
```

Tras el cambio solicitado: ejecutar build y lint, hacer commit y push a
`main`, observar los jobs de validación y despliegue en Actions y comprobar
el cambio en la URL pública. Ensayar el tiempo total: el límite de ocho
minutos del script es un máximo técnico, no una garantía de completar la
defensa en diez minutos.

## Fuentes consultadas por el asistente

- [Deploy Hooks](https://render.com/docs/deploy-hooks): secreto y parámetro `ref`.
- [Variables de Render](https://render.com/docs/environment-variables): `PORT` y `RENDER_GIT_COMMIT`.
- [Despliegues](https://render.com/docs/deploys): control de Auto-Deploy.
- [Plan gratuito](https://render.com/docs/free): suspensión y límites.

El estudiante debe revisar estas fuentes y agregar sus observaciones reales
sobre la configuración y el ensayo. El README principal contiene los comandos
de instalación, pruebas y despliegue para reproducir el proyecto.
