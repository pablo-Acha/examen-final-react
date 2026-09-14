import { setTimeout as delay } from 'node:timers/promises';

async function deploy() {
  const hook = process.env.RENDER_DEPLOY_HOOK_URL;
  const commit = process.env.GITHUB_SHA;
  const baseURL = process.env.E2E_BASE_URL;
  if (!hook || !commit || !baseURL) {
    throw new Error('Falta RENDER_DEPLOY_HOOK_URL, GITHUB_SHA o E2E_BASE_URL.');
  }

  const url = new URL(hook);
  if (url.protocol !== 'https:' || url.hostname !== 'api.render.com' || !url.pathname.startsWith('/deploy/')) {
    throw new Error('El secreto debe contener el Deploy Hook HTTPS del servicio de Render.');
  }
  // Publicamos exactamente la revisión que acaba de pasar lint y E2E.
  url.searchParams.set('ref', commit);
  let response;
  try {
    response = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(30_000) });
  } catch {
    // No mostrar la URL secreta ni el error de red que podría contenerla.
    throw new Error('No se pudo contactar el Deploy Hook de Render. Revisa el servicio antes de reintentar.');
  }
  if (!response.ok) throw new Error(`Render rechazó el despliegue (HTTP ${response.status}).`);
  console.log(`Render aceptó el despliegue del commit ${commit}. Esperando la versión publicada...`);

  const deadline = Date.now() + 8 * 60_000;
  while (Date.now() < deadline) {
    try {
      const health = await fetch(new URL('/api/health', baseURL), {
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(10_000),
      });
      if (health.ok) {
        const state = await health.json();
        if (state.status === 'ok' && state.commit === commit) {
          console.log('La versión validada ya responde en producción.');
          return;
        }
      }
    } catch {
      // Durante el arranque o el reemplazo de instancia puede no responder.
    }
    await delay(15_000);
  }
  throw new Error('Render no publicó el commit esperado en 8 minutos. Revisa los logs del despliegue.');
}

deploy().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Falló el despliegue.');
  process.exitCode = 1;
});
