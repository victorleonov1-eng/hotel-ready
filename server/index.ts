import express from 'express';
import path from 'path';
import { chatWithGuest, scoreConversation, getAnswerOptions } from './anthropic';
import { guestSystemPrompt, scorerSystemPrompt, answerOptionsPrompt } from './prompts';
import type { Scenario, ScoreResult } from '../src/content/types';

const app = express();
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

const distPath = path.join(import.meta.dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
