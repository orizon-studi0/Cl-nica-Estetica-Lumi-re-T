import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidImagePath, getImageFallback } from './imageRetry';

test('CLINIC_IMAGES contains all 6 required local clinic spaces in images/', () => {
  const expectedSpaces = ['recepcao', 'espera', 'procedimentos', 'consultorio', 'dermocosmeticos', 'circulacao'];
  for (const space of expectedSpaces) {
    const config = getImageFallback(space);
    assert.ok(config, `Space ${space} should exist`);
    assert.equal(config.path, `images/${space}.jpg`);
    assert.ok(config.label.length > 0);
  }
});

test('isValidImagePath validates local relative image paths in images/', () => {
  assert.equal(isValidImagePath('images/recepcao.jpg'), true);
  assert.equal(isValidImagePath('images/espera.jpg'), true);
  assert.equal(isValidImagePath('https://image.pollinations.ai/test.jpg'), false);
  assert.equal(isValidImagePath('/assets/test.png'), false);
  assert.equal(isValidImagePath(''), false);
});
