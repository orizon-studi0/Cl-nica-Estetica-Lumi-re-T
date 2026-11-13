/**
 * Pure schedule calculator for Clínica Lumière Estética (Moema, São Paulo)
 * Opening hours:
 * - Monday to Friday (1..5): 09:00 to 19:00
 * - Saturday (6): 09:00 to 14:00
 * - Sunday (0): Closed
 */

export interface ClinicStatusResult {
  isOpen: boolean;
  label: string;
}

export function getClinicStatus(now: Date = new Date()): ClinicStatusResult {
  // Convert to America/Sao_Paulo local parts reliably using Intl
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '10';
  const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '00';

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  const day = dayMap[weekdayStr] ?? 1;
  let hour = parseInt(hourStr, 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(minuteStr, 10);
  const totalMinutes = hour * 60 + minute;

  const openMinutes = 9 * 60; // 09:00

  if (day >= 1 && day <= 5) {
    const closeMinutes = 19 * 60; // 19:00
    if (totalMinutes >= openMinutes && totalMinutes < closeMinutes) {
      return { isOpen: true, label: 'Aberto agora, fecha às 19h' };
    }
    if (totalMinutes < openMinutes) {
      return { isOpen: false, label: 'Fechado, abre hoje às 9h' };
    }
    return { isOpen: false, label: 'Fechado, abre amanhã às 9h' };
  }

  if (day === 6) {
    const closeMinutes = 14 * 60; // 14:00
    if (totalMinutes >= openMinutes && totalMinutes < closeMinutes) {
      return { isOpen: true, label: 'Aberto agora, fecha às 14h' };
    }
    if (totalMinutes < openMinutes) {
      return { isOpen: false, label: 'Fechado, abre hoje às 9h' };
    }
    return { isOpen: false, label: 'Fechado, abre segunda às 9h' };
  }

  // Sunday (day === 0)
  return { isOpen: false, label: 'Fechado, abre amanhã às 9h' };
}
