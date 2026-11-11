import test from 'node:test';
import assert from 'node:assert/strict';
import { CLINIC_IMAGES, isValidImagePath, getImageFallback } from './imageRetry';

test('CLINIC_IMAGES contains all 6 required local clinic spaces', () => {
  const expectedSpaces = ['recepcao', 'espera', 'procedimentos', 'consultorio', 'dermocosmeticos', 'circulacao'];
  for (const space of expectedSpaces) {
    const config = getImageFallback(space);
    assert.ok(config, `Space ${space} should exist`);
    assert.equal(config.path, `imagens/${space}.jpg`);
    assert.ok(config.label.length > 0);
    assert.ok(config.icon.length > 0);
  }
});

test('isValidImagePath validates local relative image paths', () => {
  assert.equal(isValidImagePath('imagens/recepcao.jpg'), true);
  assert.equal(isValidImagePath('imagens/espera.jpg'), true);
  assert.equal(isValidImagePath('https://image.pollinations.ai/test.jpg'), false);
  assert.equal(isValidImagePath('/assets/test.png'), false);
  assert.equal(isValidImagePath(''), false);
});
