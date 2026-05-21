export const CONTACT_COPY = {
  emailLabel: 'Correo electrónico',
  phoneLabel: 'Teléfono',
  addressLabel: 'Dirección',
  nameLabel: 'Nombre',
  messageLabel: 'Mensaje',
  submitLabel: 'Enviar mensaje',
  sending: 'Enviando…',
  successMessage:
    'Gracias — te responderemos en menos de 1 día laborable.',
  errorWithEmail: (email: string) =>
    `Algo ha fallado. Inténtalo de nuevo o escríbenos a ${email}.`,
  errorGeneric: 'Algo ha fallado. Inténtalo de nuevo más tarde.',
} as const
