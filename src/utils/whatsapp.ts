/**
 * Pure helper functions for WhatsApp URL formatting and phone validation
 */

export interface AppointmentFormData {
  name: string;
  phone: string;
  treatment: string;
  preferredTime?: string;
  notes?: string;
}

export function formatWhatsAppMessage(data: AppointmentFormData): string {
  const cleanName = data.name.trim();
  const cleanPhone = data.phone.trim();
  const cleanTreatment = data.treatment.trim() || 'Avaliação Geral';
  const cleanTime = data.preferredTime?.trim() || 'Qualquer horário';
  const cleanNotes = data.notes?.trim();

  let message = `Olá! Gostaria de agendar uma avaliação na Clínica Lumière Estética.\n\n`;
  message += `*Nome:* ${cleanName}\n`;
  message += `*Telefone:* ${cleanPhone}\n`;
  message += `*Interesse:* ${cleanTreatment}\n`;
  message += `*Período preferencial:* ${cleanTime}`;

  if (cleanNotes) {
    message += `\n*Observações:* ${cleanNotes}`;
  }

  return message;
}

export function createWhatsAppUrl(phoneNumber: string, data: AppointmentFormData): string {
  const sanitizedPhone = phoneNumber.replace(/\D/g, '');
  const message = formatWhatsAppMessage(data);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${sanitizedPhone}?text=${encodedText}`;
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function isValidPhoneNumber(phone: string): boolean {
  const digits = sanitizePhoneNumber(phone);
  // Brazilian phone numbers: 10 digits (landline) or 11 digits (mobile)
  return digits.length >= 10 && digits.length <= 11;
}
