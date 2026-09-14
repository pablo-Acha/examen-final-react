import { test, expect, type Page } from '@playwright/test';
import type { MatchState, Disc } from '../../backend/src/types';

async function startMatch(page: Page): Promise<MatchState> {
  await page.goto('/');
  await page.getByLabel('Equipo azul').fill('Halcones');
  await page.getByLabel('Equipo rojo').fill('Tigres');
  const created = page.waitForResponse((response) =>
    response.url().endsWith('/api/matches') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Iniciar partido' }).click();
  const response = await created;
  expect(response.status()).toBe(201);
  expect(response.headers()['content-type']).toContain('application/json');
  const state: MatchState = await response.json();
  await expect(page.getByRole('status')).toContainText('Halcones');
  await expect(page.getByRole('status')).toContainText('Tigres');
  await expect(page.locator('canvas')).toBeVisible();
  return state;
}

async function discPoint(page: Page, disc: Disc) {
  const box = await page.locator('canvas').boundingBox();
  if (!box) throw new Error('No se encontró la cancha visible');
  return {
    x: box.x + disc.pos.x * box.width / 1000,
    y: box.y + disc.pos.y * box.height / 600,
    scaleX: box.width / 1000,
  };
}

test('inicia una partida y consulta su estado real e instrucciones', async ({ page, request }) => {
  const state = await startMatch(page);
  expect(state.discs).toHaveLength(6);
  expect(state.score).toEqual({ A: 0, B: 0 });
  const response = await request.get(`/api/matches/${state.id}`);
  expect(response.status()).toBe(200);
  const saved: MatchState = await response.json();
  expect(saved).toEqual(state);
  await expect(page.locator('.scoreboard-turn')).toHaveText(`Turno de ${state.teams[state.turn].name}`);
  await page.getByRole('button', { name: 'Cómo se juega' }).click();
  await expect(page.getByText('Empuja el balón a la portería contraria para anotar.')).toBeVisible();
});

test('rechaza un disco rival en pantalla y en Express sin consumir el turno', async ({ page, request }) => {
  const state = await startMatch(page);
  const rival = state.discs.find((disc) => disc.team !== state.turn)!;
  const point = await discPoint(page, rival);
  await page.mouse.click(point.x, point.y);
  await expect(page.locator('.event-log')).toContainText('no es tu turno');
  const rejected = await request.post(`/api/matches/${state.id}/shots`, { data: { discId: rival.id } });
  expect(rejected.status()).toBe(403);
  expect(await rejected.json()).toMatchObject({ accepted: false, reason: 'not-your-turn' });
  const current = await request.get(`/api/matches/${state.id}`);
  expect(await current.json()).toMatchObject({ phase: 'aiming', turn: state.turn, shotsTaken: { A: 0, B: 0 } });
});

test('arrastra un disco, valida el tiro y resuelve una sola vez con latencia', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let resolutions = 0;
  page.on('request', (req) => {
    if (req.url().endsWith('/resolution')) resolutions += 1;
  });
  // Retrasa la respuesta real: no sustituye el backend ni inventa su resultado.
  await page.route('**/api/matches/*/resolution', async (route) => {
    const response = await route.fetch();
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({ response });
  });
  const state = await startMatch(page);
  const disc = state.discs.find((item) => item.team === state.turn)!;
  const point = await discPoint(page, disc);
  const shotResponse = page.waitForResponse((response) => response.url().endsWith('/shots'));
  const resolvedResponse = page.waitForResponse((response) => response.url().endsWith('/resolution'));
  await page.mouse.move(point.x, point.y);
  await page.mouse.down();
  await page.mouse.move(point.x + 30 * point.scaleX, point.y, { steps: 10 });
  await page.mouse.up();
  const shot = await shotResponse;
  expect(shot.status()).toBe(200);
  expect(await shot.json()).toMatchObject({ accepted: true });
  const resolved = await resolvedResponse;
  expect(resolved.status()).toBe(200);
  const outcome: { state: MatchState; resetFormation: boolean } = await resolved.json();
  expect(outcome.resetFormation).toBe(false);
  expect(outcome.state.turn).not.toBe(state.turn);
  expect(outcome.state.shotsTaken[state.turn]).toBe(1);
  await expect(page.locator('.scoreboard-turn')).toHaveText(`Turno de ${state.teams[outcome.state.turn].name}`);
  const current = await request.get(`/api/matches/${state.id}`);
  expect(await current.json()).toMatchObject({ phase: 'aiming', shotsTaken: outcome.state.shotsTaken });
  expect(resolutions).toBe(1);
  expect(errors).toEqual([]);
});

test('la API termina en empate al agotar los tiros y rechaza seguir jugando', async ({ request }) => {
  // Prueba complementaria de API; no reemplaza las pruebas de navegador.
  const created = await request.post('/api/matches', { data: { teamAName: 'Azul', teamBName: 'Rojo' } });
  expect(created.status()).toBe(201);
  let state: MatchState = await created.json();
  for (let turn = 0; turn < state.config.maxTurnsPerTeam * 2; turn += 1) {
    const shot = await request.post(`/api/matches/${state.id}/shots`, { data: { discId: `${state.turn}-0` } });
    expect(shot.status()).toBe(200);
    const resolved = await request.post(`/api/matches/${state.id}/resolution`, { data: { goalTeam: null } });
    expect(resolved.status()).toBe(200);
    state = (await resolved.json()).state;
  }
  expect(state.phase).toBe('finished');
  expect(state.winner).toBe('draw');
  const rejected = await request.post(`/api/matches/${state.id}/shots`, { data: { discId: 'A-0' } });
  expect(rejected.status()).toBe(409);
  expect(await rejected.json()).toMatchObject({ accepted: false, reason: 'match-finished' });
});
