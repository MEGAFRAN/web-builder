export const BOOKING_STEPS = [
  { label: '1 · Servicio', step: 1 },
  { label: '2 · Fecha y hora', step: 2 },
  { label: '3 · Tus datos', step: 3 },
  { label: '4 · Confirmado', step: 4 },
] as const

export const BOOKING_COPY = {
  progressAriaLabel: 'Progreso de la reserva',
  serviceLabel: 'Servicio',
  dateLabel: 'Fecha',
  timeLabel: 'Hora',
  fullNameLabel: 'Nombre completo',
  emailLabel: 'Correo electrónico',
  phoneLabel: 'Teléfono',
  specialRequestsLabel: 'Peticiones especiales',
  optional: '(opcional)',
  confirmReservation: 'Confirmar reserva',
  confirming: 'Confirmando…',
  loadingServices: 'Cargando servicios…',
  checkingAvailability: 'Comprobando disponibilidad…',
  selectedRange: 'Seleccionado:',
  reservationConfirmedTitle: '¡Reserva confirmada!',
  reservationConfirmedFallback:
    'Hemos recibido tu solicitud y te enviaremos una confirmación por correo en breve.',
  summaryService: 'Servicio',
  summaryDate: 'Fecha',
  summaryTime: 'Hora',
  summaryConfirmation: 'Confirmación',
  summarySentTo: 'Enviada a',
  bookingUnavailableTitle: 'Reservas no disponibles',
  bookingUnavailableMessage:
    'Aún no hay servicios configurados para reservar online. Por favor, contáctanos directamente.',
  networkError:
    'No hemos podido conectar con el sistema de reservas. Inténtalo de nuevo o llámanos.',
  namePlaceholder: 'María García',
  emailPlaceholder: 'maria@ejemplo.com',
  phonePlaceholder: '+34 600 000 000',
  notesPlaceholder: 'Alergias, accesibilidad, ocasión especial…',
  slotFull: 'completo',
  slotOutsideHours: 'fuera de horario',
  slotWithinBooking: 'dentro de tu reserva',
  slotOutsideHoursAria: '– fuera del horario de este servicio',
  slotBookedAria: '– completo',
  slotCoveredAria: '– dentro de tu reserva seleccionada',
  nameError: 'Introduce un nombre completo (mínimo 2 caracteres).',
  emailError: 'Introduce un correo electrónico válido.',
  phoneError:
    'Introduce un teléfono válido (dígitos, espacios, +, -, paréntesis).',
  submitError: 'Algo ha fallado. Inténtalo de nuevo o llámanos directamente.',
  slotTakenError:
    'Ese horario acaba de reservarse — elige otra hora.',
} as const

export const BOOKING_FIELD_CLASS =
  'rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'

export function formatBookingDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
