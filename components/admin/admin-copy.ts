import { parseYmdLocal } from '@/lib/booking-utils'
import type { WeeklyHoursRow } from '@/types/admin'

/** Single source of truth for admin UI copy (tests import this module too). */
export const adminCopy = {
  common: {
    error: 'Error',
    loading: 'Cargando…',
    save: 'Guardar',
    cancel: 'Cancelar',
    back: 'Volver',
    close: 'Cerrar',
    closePanel: 'Cerrar panel',
    closeMenu: 'Cerrar menú',
    delete: 'Eliminar',
    serviceFallback: 'Servicio',
    emDash: '—',
    minutes: 'minutos',
    noDescription: 'Sin descripción',
    expand: 'Ampliar',
    showLess: 'Mostrar menos',
  },
  nav: {
    ariaAdmin: 'Administración',
    ariaSections: 'Secciones de administración',
    bookings: 'Reservas',
    services: 'Servicios',
    availability: 'Disponibilidad',
    settings: 'Ajustes',
    menu: 'Menú',
    signOut: 'Cerrar sesión',
    adminMenuTitle: (businessName: string) => `Menú de administración de ${businessName}`,
  },
  login: {
    heading: 'Iniciar sesión',
    submit: 'Iniciar sesión',
    clientIdLabel: 'ID del negocio',
    emailLabel: 'Correo electrónico',
    passwordLabel: 'Contraseña',
    defaultError: 'Correo o contraseña incorrectos',
    misconfiguredTitle: 'Inicio de sesión no disponible',
    misconfiguredMessage:
      'Faltan variables de entorno de autenticación de administración. Configure ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_SESSION_SECRET en el servidor.',
  },
  settings: {
    heading: 'Ajustes',
    intro:
      'Aquí aparecerán las preferencias del negocio y las integraciones. Para cambios estructurales, contacte con el operador de la plataforma.',
  },
  bookings: {
    heading: 'Reservas',
    newAppointment: 'Nueva cita',
    newAppointmentButton: '+ Nueva cita',
    appointment: 'Cita',
    cancelAppointment: 'Cancelar cita…',
    markNoShow: 'Marcar como ausencia',
    cancelModalTitle: '¿Cancelar esta cita?',
    confirmCancel: 'Confirmar cancelación',
    emptyDay: 'No hay citas este día',
    closedPrefix: 'Cerrado',
    closedNoBookings: 'No se aceptan reservas en esta fecha.',
    specialDayListNote:
      'Este día está marcado como cerrado o tiene horario especial; las citas aparecen abajo sin franja horaria.',
    errors: {
      failedReservations: 'No se pudieron cargar las reservas.',
      failedSchedule: 'No se pudo cargar el horario.',
      generic: 'Algo salió mal.',
      updateFailed: 'No se pudo actualizar.',
    },
  },
  calendar: {
    previous: 'Anterior',
    next: 'Siguiente',
    today: 'Hoy',
    jumpToDate: 'Ir a fecha',
    viewModeAria: 'Modo de vista',
    day: 'Día',
    week: 'Semana',
  },
  appointmentForm: {
    title: 'Nueva cita',
    service: 'Servicio',
    date: 'Fecha',
    time: 'Hora',
    chooseSlot: 'Elija una franja',
    customerName: 'Nombre del cliente',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    notes: 'Notas',
    selectServiceDateTime: 'Seleccione un servicio, una fecha y una hora.',
    failedLoadServices: 'No se pudieron cargar los servicios.',
    saveFailed: 'No se pudo guardar.',
    saveError: 'Error al guardar.',
  },
  drawer: {
    client: 'Cliente',
    phone: 'Teléfono',
    email: 'Correo',
    service: 'Servicio',
    duration: 'Duración',
    when: 'Cuándo',
    notes: 'Notas',
    status: 'Estado',
  },
  services: {
    heading: 'Servicios',
    addService: 'Añadir servicio',
    addServiceButton: '+ Añadir servicio',
    editService: 'Editar servicio',
    deleteServiceTitle: '¿Eliminar este servicio?',
    emptyOnboarding:
      'Aún no ha añadido ningún servicio. Añada el primero para empezar a aceptar reservas.',
    errors: {
      failedLoad: 'No se pudieron cargar los servicios.',
      loadFailed: 'No se pudo cargar.',
      saveFailed: 'Error al guardar.',
      reorderFailed: 'Error al reordenar.',
      deleteFailed: 'Error al eliminar.',
    },
    form: {
      name: 'Nombre',
      category: 'Categoría (opcional)',
      noCategory: 'Sin categoría',
      newCategory: '+ Nueva categoría',
      newCategoryPlaceholder: 'Nombre de la nueva categoría',
      newCategoryHint: 'Escriba un nombre para la nueva categoría.',
      pickExistingCategory: 'Elegir categoría existente',
      removeCategory: (name: string) => `Quitar categoría ${name}`,
      description: 'Descripción (opcional)',
      duration: 'Duración (minutos)',
      price: 'Precio',
      currency: 'Símbolo de moneda',
      nameRequired: 'El nombre es obligatorio.',
      durationRange: 'La duración debe estar entre 1 y 1440 minutos.',
      priceNonNegative: 'El precio debe ser cero o mayor.',
      hasVariations: 'Este servicio tiene variantes (ej. múltiples duraciones o precios)',
      variationLabel: 'Etiqueta (opcional)',
      variationLabelPlaceholder: 'Express / Completo / Premium',
      variationDuration: 'Duración',
      variationPrice: 'Precio',
      addVariation: '+ Añadir variante',
      removeVariationAria: (index: number) => `Eliminar variante ${index}`,
      variationsRequired: 'Añada al menos una variante con duración y precio válidos.',
      variationDurationInvalid: 'Cada variante debe tener una duración entre 1 y 1440 minutos.',
      variationPriceInvalid: 'Cada variante debe tener un precio cero o mayor.',
    },
    uncategorized: 'Sin categoría',
    editAria: (name: string) => `Editar ${name}`,
    deleteAria: (name: string) => `Eliminar ${name}`,
  },
  availability: {
    heading: 'Disponibilidad',
    weeklyHours: 'Horario semanal',
    dateSpecificHours: 'Horarios por fecha',
    addHoursButton: '+ Horario',
    addException: 'Añadir excepción',
    saveSchedule: 'Guardar horario',
    saveException: 'Guardar excepción',
    closed: 'Cerrado',
    custom: 'Personalizado',
    customHours: 'Horario personalizado',
    date: 'Fecha',
    from: 'Desde',
    to: 'Hasta',
    scheduleSaved: 'Horario guardado.',
    errors: {
      failedLoad: 'No se pudo cargar el horario.',
      loadFailed: 'No se pudo cargar.',
      saveFailed: 'Error al guardar.',
      deleteFailed: 'No se pudo eliminar.',
    },
    removeHoursAria: (dayLabel: string) => `Quitar horario de ${dayLabel}`,
    removeExceptionAria: (date: string) => `Eliminar excepción del ${date}`,
    addHoursAria: (dayLabel: string) => `Añadir horario para ${dayLabel}`,
  },
} as const

export const DAY_LABEL: Record<WeeklyHoursRow['day'], string> = {
  mon: 'Lunes',
  tue: 'Martes',
  wed: 'Miércoles',
  thu: 'Jueves',
  fri: 'Viernes',
  sat: 'Sábado',
  sun: 'Domingo',
}

/** Week column headers (Mon–Sun) for the week grid. */
export const WEEK_SHORT_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const

export function weekDayHeader(shortLabel: string, dayOfMonth: string): string {
  return `${shortLabel} · ${dayOfMonth}`
}

export function closedHeadline(dateLabel: string): string {
  return `${adminCopy.bookings.closedPrefix} · ${dateLabel}`
}

/** Pretty date for admin UI. */
export function formatPrettyDateEs(ymd: string): string {
  const d = parseYmdLocal(ymd)
  return d.toLocaleDateString('es', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function reservationStatusDisplay(status: string): {
  label: string
  variant: 'error' | 'warning' | 'success'
} {
  if (status === 'cancelled') return { label: 'Cancelada', variant: 'error' }
  if (status === 'no-show') return { label: 'No asistió', variant: 'warning' }
  if (status === 'pending') return { label: 'Pendiente de confirmación', variant: 'warning' }
  return { label: 'Confirmada', variant: 'success' }
}

export function reservationStatusAriaEs(status: string): string {
  return reservationStatusDisplay(status).label
}

export function bookingListAriaLabel(
  name: string,
  time: string,
  serviceName: string | null | undefined,
  status: string,
): string {
  return `${name}, ${time}, ${serviceName ?? adminCopy.common.serviceFallback}, ${reservationStatusAriaEs(status)}`
}

export function bookingTimelineAriaLabel(
  name: string,
  serviceName: string | null | undefined,
  time: string,
  endLabel: string,
  status: string,
): string {
  return `${name}, ${serviceName ?? adminCopy.common.serviceFallback}, ${time}–${endLabel}, ${reservationStatusAriaEs(status)}`
}

export function bookingWeekAriaLabel(time: string, name: string, status: string): string {
  return `${time}, ${name}, ${reservationStatusAriaEs(status)}`
}
