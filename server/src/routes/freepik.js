import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const FREEPIK_KEY = process.env.FREEPIK_API_KEY;

// ── POST /generate — Generar imagen con IA ──────────────
router.post('/generate', async (req, res, next) => {
  try {
    if (!FREEPIK_KEY) {
      return res.status(500).json({ error: 'API key de Freepik no configurada' });
    }

    const { prompt, aspect_ratio, model, resolution } = req.body;

    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({ error: 'Describe la imagen que quieres (minimo 5 caracteres)' });
    }

    const response = await fetch('https://api.freepik.com/v1/ai/mystic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-freepik-api-key': FREEPIK_KEY,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        aspect_ratio: aspect_ratio || 'square_1_1',
        model: model || 'realism',
        resolution: resolution || '2k',
        filter_nsfw: true,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Freepik] Error:', response.status, data);
      return res.status(response.status).json({
        error: data?.message || data?.error || 'Error al generar la imagen',
      });
    }

    res.json(data);
  } catch (error) {
    console.error('[Freepik] Exception:', error);
    next(error);
  }
});

// ── GET /status/:taskId — Consultar estado de generacion ─
router.get('/status/:taskId', async (req, res, next) => {
  try {
    if (!FREEPIK_KEY) {
      return res.status(500).json({ error: 'API key de Freepik no configurada' });
    }

    const response = await fetch(`https://api.freepik.com/v1/ai/mystic/${req.params.taskId}`, {
      headers: {
        'x-freepik-api-key': FREEPIK_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.message || 'Error al consultar estado',
      });
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

export default router;
