'use client'

import { useState } from 'react'
import { ContactForm } from '@/components/inputs/ContactForm'
import { Alert } from '@/components/content/Alert'
import { CONTACT_COPY } from '@/lib/contact-public-copy'

type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'

interface ContactFormSectionProps {
  fallbackEmail?: string | null
}

export default function ContactFormSection({ fallbackEmail }: ContactFormSectionProps) {
  const [state, setState] = useState<SubmissionState>('idle')

  const handleSubmit = async (data: { name: string; email: string; message: string }) => {
    setState('submitting')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        setState('error')
        return
      }
      setState('success')
    } catch {
      setState('error')
    }
  }

  const errorMessage = fallbackEmail
    ? CONTACT_COPY.errorWithEmail(fallbackEmail)
    : CONTACT_COPY.errorGeneric

  return (
    <div data-component="contact-form-section" className="flex flex-col gap-6">
      <ContactForm
        isSubmitting={state === 'submitting'}
        onSubmitData={handleSubmit}
        submitLabel={CONTACT_COPY.submitLabel}
        nameLabel={CONTACT_COPY.nameLabel}
        emailLabel={CONTACT_COPY.emailLabel}
        messageLabel={CONTACT_COPY.messageLabel}
      />
      {state === 'success' && (
        <Alert variant="success" message={CONTACT_COPY.successMessage} />
      )}
      {state === 'error' && <Alert variant="error" message={errorMessage} />}
    </div>
  )
}
