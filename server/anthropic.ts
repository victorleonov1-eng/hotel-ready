import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import type { GuestTurn, AnswerOptions } from '../src/content/types';

dotenv.config();

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.MODEL_NAME || 'claude-haiku-4-5-20251001';

function stripMarkdown(text: string): string {
  return text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
}

export async function chatWithGuest(
  systemPrompt: string,
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<GuestTurn> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: systemPrompt,
    messages,
  });
  const block = response.content[0];
  const text = block.type === 'text' ? block.text : '';
  const clean = stripMarkdown(text);
  const parsed = JSON.parse(clean);
  return parsed as GuestTurn;
}

export async function scoreConversation(
  systemPrompt: string,
  transcript: string
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: `Here is the full transcript of the role-play:\n\n${transcript}` }],
  });
  const block = response.content[0];
  let text = block.type === 'text' ? block.text : '';
  return stripMarkdown(text);
}

export async function getAnswerOptions(
  systemPrompt: string,
  transcript: string
): Promise<AnswerOptions> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: transcript }],
  });
  const block = response.content[0];
  const text = block.type === 'text' ? block.text : '';
  const clean = stripMarkdown(text);
  const parsed = JSON.parse(clean);
  return parsed as AnswerOptions;
}
