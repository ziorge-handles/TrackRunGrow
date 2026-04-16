import { z } from 'zod'

export const registerPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')

/** 32 hex chars from `randomBytes(16)` — must match Stripe `client_reference_id` on the checkout session. */
const checkoutRefSchema = z
  .string()
  .length(32)
  .regex(/^[a-f0-9]{32}$/, 'Invalid checkout reference')

export const registerSchema = z
  .object({
    name: z.string().min(2).max(100, 'Name too long'),
    email: z.string().email().max(254, 'Email too long').optional(),
    password: registerPasswordSchema,
    stripeSessionId: z.string().optional(),
    /** Required with stripeSessionId — proves the client completed checkout via our success URL. */
    checkoutRef: checkoutRefSchema.optional(),
    inviteToken: z.string().min(10).max(200).optional(),
  })
  .refine((data) => data.stripeSessionId || data.inviteToken, {
    message: 'Either stripeSessionId or inviteToken is required',
    path: ['stripeSessionId'],
  })
  .refine((data) => !data.stripeSessionId || !!data.checkoutRef, {
    message: 'checkoutRef is required for paid registration',
    path: ['checkoutRef'],
  })
