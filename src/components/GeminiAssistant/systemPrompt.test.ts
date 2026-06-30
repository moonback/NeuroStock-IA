import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSystemPrompt } from './systemPrompt';

test('buildSystemPrompt includes product memory instructions', () => {
  const prompt = buildSystemPrompt({
    language: 'français',
    inventory: [],
    categories: [],
    user: { name: 'Alice' },
    storeName: 'NeuroStock',
  });

  assert.match(prompt, /mémoire produit/i);
  assert.match(prompt, /nouveau produit/i);
  assert.match(prompt, /produit courant/i);
});
