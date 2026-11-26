import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHydraLabel } from './HydraLog';

test('normalizeHydraLabel replaces mechanical double-slash syntax with clean typographic separator', () => {
  assert.equal(normalizeHydraLabel('HYDRA // GOUVERNANCE', 'HYDRA · Système'), 'HYDRA · GOUVERNANCE');
  assert.equal(normalizeHydraLabel('HYDRA//RÉPARTITEUR', 'HYDRA · Système'), 'HYDRA · RÉPARTITEUR');
});

test('normalizeHydraLabel falls back cleanly when label is missing or blank', () => {
  assert.equal(normalizeHydraLabel(undefined, 'HYDRA · Alerte'), 'HYDRA · Alerte');
  assert.equal(normalizeHydraLabel('   ', 'HYDRA · Noyau'), 'HYDRA · Noyau');
});
