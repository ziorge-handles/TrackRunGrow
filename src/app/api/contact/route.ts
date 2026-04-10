import { NextRequest } from 'next/server'
import { z } from 'zod'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  email: z.string().email('Invalid email address').max(200),
  subject: z.string().min(1, 'Subject is required').max(300),
  message: z.string().min(1, 'Message is required').max(5000),
})

// Simple in-memory rate limiting (3 per IP per hour)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }

  if (entry.count >= 3) {
    return false
  }

  entry.count += 1
  return true
}

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Validation failed'
    return Response.json({ error: firstError }, { status: 400 })
  }

  const { name, email, subject, message } = parsed.data

  // Send email via SendGrid if API key is configured
  const sendgridKey = process.env.SENDGRID_API_KEY
  if (sendgridKey) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: 'ryanmelvin@trackrungrow.com' }],
              subject: `[TrackRunGrow Contact] ${subject}`,
            },
          ],
          from: { email: 'noreply@trackrungrow.com', name: 'TrackRunGrow Contact Form' },
          reply_to: { email, name },
          content: [
            {
              type: 'text/plain',
              value: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
            },
          ],
        }),
      })

      if (!res.ok) {
        console.error('SendGrid error:', res.status, await res.text())
        return Response.json(
          { error: 'Failed to send message. Please try emailing us directly.' },
          { status: 500 },
        )
      }
    } catch (err) {
      console.error('SendGrid error:', err)
      return Response.json(
        { error: 'Failed to send message. Please try emailing us directly.' },
        { status: 500 },
      )
    }
  } else {
    // No SendGrid key -- log the contact form submission
    console.log('Contact form submission (no SendGrid key configured):', {
      name,
      email,
      subject,
      message: message.slice(0, 200),
    })
  }

  return Response.json({ success: true })
}
