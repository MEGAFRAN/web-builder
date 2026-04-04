'use client'

import { useState } from 'react'
import { ContactForm } from '@/components/inputs/ContactForm'
import { Alert } from '@/components/content/Alert'

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
    ? `Something went wrong. Please try again or email us directly at ${fallbackEmail}.`
    : 'Something went wrong. Please try again later.'

  return (
    <div className="flex flex-col gap-6">
      <ContactForm
        isSubmitting={state === 'submitting'}
        onSubmitData={handleSubmit}
      />
      {state === 'success' && (
        <Alert
          variant="success"
          message="Thank you — we'll be in touch within 1 business day."
        />
      )}
      {state === 'error' && (
        <Alert
          variant="error"
          message={errorMessage}
        />
      )}
    </div>
  )
}
