import express from 'express';
import path from 'path';
import { matchesRouter } from './matchesRouter';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json());

// Permite comprobar que Render ya sirve el commit validado por GitHub Actions.
app.get('/api/health', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ status: 'ok', commit: process.env.RENDER_GIT_COMMIT || null });
});

app.use('/api/matches', matchesRouter);

// El frontend compilado (npm run build en /frontend) vive en frontend/dist.
// Express lo sirve desde el mismo dominio y puerto que la API, tal como
// exige el examen.
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// Cualquier ruta que no sea /api/* devuelve index.html, para que las rutas
// del lado del cliente (si las hubiera) también funcionen al refrescar.
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Soccer Stars backend escuchando en el puerto ${PORT}`);
});
