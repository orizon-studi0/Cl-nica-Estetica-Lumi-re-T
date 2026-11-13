import test from 'node:test';
import assert from 'node:assert/strict';
import { getClinicStatus } from './clinicSchedule';

// Helper: create a UTC Date that corresponds to a specific Sao Paulo (UTC-3) time
function spDate(year: number, month: number, day: number, hour: number, minute: number): Date {
  // Sao Paulo standard offset is UTC-3
  return new Date(Date.UTC(year, month - 1, day, hour + 3, minute, 0));
}

test('returns open during weekday business hours (Mon 10:30)', () => {
  // 2026-11-09 is Monday
  const res = getClinicStatus(spDate(2026, 11, 9, 10, 30));
  assert.equal(res.isOpen, true);
  assert.equal(res.label, 'Aberto agora, fecha às 19h');
});

test('returns closed before opening on weekday (Tue 08:15)', () => {
  const res = getClinicStatus(spDate(2026, 11, 10, 8, 15));
  assert.equal(res.isOpen, false);
  assert.equal(res.label, 'Fechado, abre hoje às 9h');
});

test('returns closed after closing on weekday (Fri 19:30)', () => {
  const res = getClinicStatus(spDate(2026, 11, 13, 19, 30));
  assert.equal(res.isOpen, false);
  assert.equal(res.label, 'Fechado, abre amanhã às 9h');
});

test('returns open on Saturday morning (Sat 11:00)', () => {
  const res = getClinicStatus(spDate(2026, 11, 14, 11, 0));
  assert.equal(res.isOpen, true);
  assert.equal(res.label, 'Aberto agora, fecha às 14h');
});

test('returns closed on Saturday afternoon pointing to Monday (Sat 15:00)', () => {
  const res = getClinicStatus(spDate(2026, 11, 14, 15, 0));
  assert.equal(res.isOpen, false);
  assert.equal(res.label, 'Fechado, abre segunda às 9h');
});

test('returns closed on Sunday pointing to tomorrow (Sun 12:00)', () => {
  const res = getClinicStatus(spDate(2026, 11, 15, 12, 0));
  assert.equal(res.isOpen, false);
  assert.equal(res.label, 'Fechado, abre amanhã às 9h');
});
