require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const MAGIC_HOUR_API_KEY = process.env.MAGIC_HOUR_API_KEY;
const MAGIC_HOUR_MODEL = process.env.MAGIC_HOUR_MODEL || 'ltx-2.3';
const MAGIC_HOUR_BASE = 'https://api.magichour.ai/v1';

if (!MAGIC_HOUR_API_KEY) {
  console.warn('⚠️  MAGIC_HOUR_API_KEY is not set. Set it in your .env file or Render environment variables.');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create a new text-to-video generation job
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, aspectRatio, endSeconds, resolution } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'A prompt is required.' });
    }

    const payload = {
      name: `Cymor Video ${Date.now()}`,
      end_seconds: Number(endSeconds) || 5,
      aspect_ratio: aspectRatio || '16:9',
      resolution: resolution || '480p',
      model: MAGIC_HOUR_MODEL,
      audio: true,
      style: {
        prompt: prompt.trim()
      }
    };

    const mhRes = await fetch(`${MAGIC_HOUR_BASE}/text-to-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MAGIC_HOUR_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await mhRes.json();

    if (!mhRes.ok) {
      return res.status(mhRes.status).json({
        error: data.message || data.error || 'Magic Hour rejected the request.',
        details: data
      });
    }

    // data => { id, credits_charged }
    res.json(data);
  } catch (err) {
    console.error('generate error:', err);
    res.status(500).json({ error: 'Something broke while starting the render.' });
  }
});

// Poll the status of a video project
app.get('/api/status/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const mhRes = await fetch(`${MAGIC_HOUR_BASE}/video-projects/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${MAGIC_HOUR_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const data = await mhRes.json();

    if (!mhRes.ok) {
      return res.status(mhRes.status).json({
        error: data.message || data.error || 'Could not fetch status.',
        details: data
      });
    }

    // data => { status: "queued" | "rendering" | "complete" | "error", downloads: [...], error }
    res.json(data);
  } catch (err) {
    console.error('status error:', err);
    res.status(500).json({ error: 'Something broke while checking on the render.' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`🎬 Cymor Video Generator running on port ${PORT}`);
});
