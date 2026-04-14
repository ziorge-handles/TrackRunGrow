import { z } from 'zod'

export const registerPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')

export const registerSchema = z
  .object({
    name: z.string().min(2).max(100, 'Name too long'),
    email: z.string().email().max(254, 'Email too long').optional(),
    password: registerPasswordSchema,
    stripeSessionId: z.string().optional(),
    inviteToken: z.string().min(10).max(200).optional(),
  })
  .refine((data) => data.stripeSessionId || data.inviteToken, {
    message: 'Either stripeSessionId or inviteToken is required',
    path: ['stripeSessionId'],
  })
