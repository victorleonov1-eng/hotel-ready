import express from 'express';
import cors from 'cors';
import path from 'path';
import { chatWithGuest, scoreConversation, getAnswerOptions } from './anthropic.js';
import { guestSystemPrompt, scorerSystemPrompt, answerOptionsPrompt } from './prompts.js';
import { textToSpeechElevenLabs, AVAILABLE_VOICES } from './elevenlabs.js';
import { generateReportPDF } from './pdfreport.js';
import type { Scenario, ScoreResult, UserProfile } from '../src/content/types.js';

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: [
    'https://hotel-ready.vercel.app',
    'http://localhost:5173', // for local development (Vite)
    'http://localhost:5174', // for local development
  ],
  credentials: true,
}));

app.use(express.json());

app.post('/api/guest-turn', async (req, res) => {
  try {
    const { scenario, messages } = req.body as {
      scenario: Scenario;
      messages: { role: 'user' | 'assistant'; content: string }[];
    };
    const systemPrompt = guestSystemPrompt(scenario);
    const result = await chatWithGuest(systemPrompt, messages);
    res.json(result);
  } catch (err: any) {
    console.error('guest-turn error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/score', async (req, res) => {
  try {
    const { scenario, transcript } = req.body as {
      scenario: Scenario;
      transcript: string;
    };
    const systemPrompt = scorerSystemPrompt(scenario);
    const raw = await scoreConversation(systemPrompt, transcript);

    let result: ScoreResult;
    try {
      result = JSON.parse(raw);
    } catch {
      const retryRaw = await scoreConversation(
        systemPrompt + '\n\nIMPORTANT: Return ONLY valid JSON. No markdown fences, no explanation.',
        transcript
      );
      result = JSON.parse(retryRaw);
    }

    res.json(result);
  } catch (err: any) {
    console.error('score error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/answer-options', async (req, res) => {
  try {
    const { scenario, transcript } = req.body as {
      scenario: Scenario;
      transcript: string;
    };
    const systemPrompt = answerOptionsPrompt(scenario, transcript);
    const raw = await getAnswerOptions(systemPrompt, transcript);
    res.json(raw);
  } catch (err: any) {
    console.error('answer-options error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId, emotion } = req.body as {
      text: string;
      voiceId?: string;
      emotion?: string;
    };

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log(`[TTS] Requesting audio for voice: ${voiceId || 'default'}, emotion: ${emotion || 'none'}`);
    const audioBuffer = await textToSpeechElevenLabs(text, voiceId, emotion);

    if (!audioBuffer) {
      console.error('[TTS] Failed to generate audio - ElevenLabs returned null');
      return res.status(503).json({ error: 'TTS service unavailable, use browser fallback' });
    }

    console.log('[TTS] Successfully generated audio');

    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (err: any) {
    console.error('tts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/voices', (_req, res) => {
  res.json(AVAILABLE_VOICES);
});

app.post('/api/export-report', async (req, res) => {
  try {
    const { profiles, scenarios } = req.body as {
      profiles: UserProfile[];
      scenarios: Scenario[];
    };

    if (!profiles || !scenarios) {
      return res.status(400).json({ error: 'Profiles and scenarios are required' });
    }

    const pdfBuffer = await generateReportPDF(profiles, scenarios);

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="team-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.send(pdfBuffer);
  } catch (err: any) {
    console.error('export-report error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const distPath = path.join(import.meta.dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
