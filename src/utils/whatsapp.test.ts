import test from 'node:test';
import assert from 'node:assert/strict';
import { formatWhatsAppMessage, createWhatsAppUrl, isValidPhoneNumber, sanitizePhoneNumber } from './whatsapp';

test('formatWhatsAppMessage formats clean readable message', () => {
  const message = formatWhatsAppMessage({
    name: 'Ana Carolina',
    phone: '(11) 98765-4321',
    treatment: 'Limpeza de Pele',
    preferredTime: 'Tarde (14h - 18h)',
    notes: 'Primeira vez na clínica',
  });

  assert.ok(message.includes('Ana Carolina'));
  assert.ok(message.includes('(11) 98765-4321'));
  assert.ok(message.includes('Limpeza de Pele'));
  assert.ok(message.includes('Tarde (14h - 18h)'));
  assert.ok(message.includes('Primeira vez na clínica'));
});

test('createWhatsAppUrl generates valid wa.me link with encoded text', () => {
  const url = createWhatsAppUrl('5511999998888', {
    name: 'Beatriz Lima',
    phone: '11988887777',
    treatment: 'Harmonização Facial',
  });

  assert.ok(url.startsWith('https://wa.me/5511999998888?text='));
  assert.ok(url.includes('Beatriz%20Lima'));
  assert.ok(url.includes('Harmoniza%C3%A7%C3%A3o%20Facial'));
});

test('phone validation detects valid and invalid numbers', () => {
  assert.equal(isValidPhoneNumber('(11) 99999-8888'), true);
  assert.equal(isValidPhoneNumber('11999998888'), true);
  assert.equal(isValidPhoneNumber('1133334444'), true);
  assert.equal(isValidPhoneNumber('123'), false);
  assert.equal(isValidPhoneNumber(''), false);
});

test('sanitizePhoneNumber removes non-numeric characters', () => {
  assert.equal(sanitizePhoneNumber('+55 (11) 99999-8888'), '5511999998888');
});
