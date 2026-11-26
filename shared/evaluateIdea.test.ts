import test from 'node:test';
import assert from 'node:assert/strict';
import { validateIdeaInput, MIN_IDEA_LENGTH, MAX_IDEA_LENGTH } from './evaluateIdea';
import { DEV_ANSWERS } from './devAnswers';
import { getActForLevel, getLevelHint, LEVEL_NAMES } from '../src/constants';

test('validateIdeaInput rejects non-strings, too short, and too long ideas', () => {
  assert.equal(validateIdeaInput(null).ok, false);
  assert.equal(validateIdeaInput(123).ok, false);

  const tooShort = validateIdeaInput('trop court');
  assert.equal(tooShort.ok, false);
  if (!tooShort.ok) {
    assert.match(tooShort.error, new RegExp(String(MIN_IDEA_LENGTH)));
  }

  const tooLong = validateIdeaInput('a'.repeat(MAX_IDEA_LENGTH + 1));
  assert.equal(tooLong.ok, false);
  if (!tooLong.ok) {
    assert.match(tooLong.error, new RegExp(String(MAX_IDEA_LENGTH)));
  }
});

test('validateIdeaInput trims and accepts valid ideas', () => {
  const res = validateIdeaInput('   Capteurs IoT d’humidité connectés en boucle fermée pour économiser l’eau agricole.   ');
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(
      res.idea,
      'Capteurs IoT d’humidité connectés en boucle fermée pour économiser l’eau agricole.'
    );
  }
});

test('getActForLevel maps levels 1..13 to Acts 1, 2, 3', () => {
  assert.equal(getActForLevel(1)?.id, 1);
  assert.equal(getActForLevel(3)?.id, 1);
  assert.equal(getActForLevel(4)?.id, 2);
  assert.equal(getActForLevel(10)?.id, 2);
  assert.equal(getActForLevel(11)?.id, 3);
  assert.equal(getActForLevel(13)?.id, 3);
  assert.equal(getActForLevel(0), undefined);
  assert.equal(getActForLevel(14), undefined);
});

test('getLevelHint resolves single-step and multi-step hints', () => {
  assert.ok(typeof getLevelHint(1) === 'string' && getLevelHint(1)!.length > 10);
  assert.ok(typeof getLevelHint(7, 2) === 'string' && getLevelHint(7, 2)!.length > 10);
  assert.equal(getLevelHint(7, 99), null);
  assert.equal(getLevelHint(99), null);
});

test('all 13 playable levels have titles and dev answers', () => {
  for (let lvl = 1; lvl <= 13; lvl++) {
    assert.ok(LEVEL_NAMES[lvl], `Missing LEVEL_NAMES[${lvl}]`);
    assert.ok(DEV_ANSWERS[lvl], `Missing DEV_ANSWERS[${lvl}]`);
  }
});
